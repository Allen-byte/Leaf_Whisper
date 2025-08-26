import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { Dropdown } from '../components/ui/Dropdown';
import { COLORS } from '../theme/colors';
import { createPost, fetchTags } from '../services/onlineOnlyStorage';
import { useToastContext } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import * as ImagePicker from 'expo-image-picker';
import TagService from '../services/tagService';
import ImageViewer from 'react-native-image-zoom-viewer';
import * as Crypto from 'expo-crypto';
import { v4 as uuidv4 } from 'uuid';
import { moods } from '../theme/moods';


// 从文本中提取标签的函数
const extractTagsFromText = (text) => {
  if (!text || typeof text !== 'string') return [];

  // 使用正则表达式匹配 #标签 格式
  const tagRegex = /#([^\s#]+)/g;
  const matches = [];
  let match;

  while ((match = tagRegex.exec(text)) !== null) {
    const tag = match[1].trim();
    if (tag && !matches.includes(tag)) {
      matches.push(tag);
    }
  }

  return matches;
};

/* ========= 新增：浮入标签组件 ========= */
const TagBubble = ({ tag, selected, onPress, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <TouchableOpacity
        onPress={() => onPress(tag)}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: COLORS.bg,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: COLORS.text,
          }}
        >
          #{tag}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/* ========= 标签加载骨架屏组件 ========= */
const TagSkeleton = ({ delay = 0 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmer());
    };

    const timer = setTimeout(shimmer, delay);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={{
        marginRight: 8,
        marginBottom: 8,
        opacity: shimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 0.7],
        }),
      }}
    >
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: COLORS.borderLight,
          width: Math.random() * 60 + 60, // 随机宽度模拟不同长度的标签
          height: 32,
        }}
      />
    </Animated.View>
  );
};

export const CreateScreen = ({ navigation, route }) => {
  const [charCount, setCharCount] = useState(0);
  const [selectedMood, setSelectedMood] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tagsCache, setTagsCache] = useState(new Map()); // 缓存机制
  const [showLocalTags, setShowLocalTags] = useState(false); // 是否显示本地预设标签
  const [requestTimeout, setRequestTimeout] = useState(false); // 请求超时状态

  const fetchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const requestTimeoutRef = useRef(null);

  // 本地预设标签（常用标签）
  const localTags = [
    '日常', '心情', '分享', '生活', '工作', '学习',
    '感悟', '随想', '吐槽', '开心', '困惑', '成长',
    '美食', '旅行', '读书', '电影', '音乐', '运动'
  ];

  /* 输入框内容变化时自动拉取标签 */
  const handleChange = useCallback((newText) => {
    setText(newText);
    setCharCount(newText.length);

    // 清除之前的定时器和请求
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setRequestTimeout(false);
    setShowLocalTags(false);

    // 如果内容为空，清空标签
    if (!newText.trim()) {
      setTags([]);
      setLoading(false);
      return;
    }

    // 如果内容太短，显示本地预设标签
    if (newText.trim().length < 10) {
      setTags(localTags.slice(0, 6)); // 显示前6个常用标签
      setShowLocalTags(true);
      setLoading(false);
      return;
    }

    // 检查缓存
    const cacheKey = newText.trim().toLowerCase();
    if (tagsCache.has(cacheKey)) {
      setTags(tagsCache.get(cacheKey));
      setLoading(false);
      setShowLocalTags(false);
      return;
    }

    // 防抖 2秒后请求（增加防抖时间，减少无效请求）
    fetchTimeoutRef.current = setTimeout(() => {
      handleFetchTags(newText.trim());
    }, 3000);
  }, [tagsCache, localTags]);

  const handleFetchTags = async (content) => {
    if (!content) return;

    setLoading(true);
    setShowLocalTags(false);
    setRequestTimeout(false);

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // 设置6秒超时
    requestTimeoutRef.current = setTimeout(() => {
      if (!signal.aborted) {
        setRequestTimeout(true);
        setLoading(false);
        // 超时后显示本地标签作为备选
        setTags(localTags.slice(0, 8));
        setShowLocalTags(true);
      }
    }, 12000);

    try {
      const { data } = await fetchTags(content, { signal });

      const jsonData = JSON.parse(data);

      // 检查请求是否被取消
      if (signal.aborted) return;

      // 清除超时定时器
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }

      const fetchedTags = jsonData;

      if (fetchedTags.length > 0) {
        setTags(fetchedTags);
        setShowLocalTags(false);

        // 缓存结果
        const cacheKey = content.toLowerCase();
        setTagsCache(prev => new Map(prev.set(cacheKey, fetchedTags)));
      } else {
        // API返回空结果时，显示本地标签
        setTags(localTags.slice(0, 6));
        setShowLocalTags(true);
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('标签请求被取消');
        return;
      }
      console.error('获取标签失败:', error);

      // 请求失败时显示本地标签作为备选
      setTags(localTags.slice(0, 6));
      setShowLocalTags(true);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }
  var fetchCount = 0
  // 手动重新获取标签
  const handleRefreshTags = () => {
    if (fetchCount < 2) {
      if (text.trim().length >= 10) {
        handleFetchTags(text.trim());
        fetchCount += 1;
      } else {
        showWarning("点的太频繁啦");
      }
    }
  };

  const toggleTag = (tag) => {
    // 检查文本末尾是否已经有#号
    const currentText = text;
    const lastChar = currentText.slice(-1);

    let tagText;
    if (lastChar === '#') {
      // 如果末尾已经有#号，只添加标签内容和空格
      tagText = `${tag} `;
    } else {
      // 如果末尾没有#号，添加完整的#标签格式
      tagText = `#${tag} `;
    }

    setText(prev => prev + tagText);
    setCharCount(prev => prev + tagText.length);
  };


  // 图片预览
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const { showError, showSuccess, showWarning, showConfirm } = useToastContext();
  const { user, updateUser, isLoggedIn, refreshUser } = useUser();

  const maxChars = 500;
  const maxImages = 5;
  const valid = text.trim().length > 0;


  // 监听页面焦点，处理各种返回参数
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.shouldRefreshUser) {
        refreshUser();
        navigation.setParams({ shouldRefreshUser: undefined });
      }

      // 处理审核通过后的发布
      if (route.params?.shouldPublish) {
        handleActualPublish(route.params?.reviewedContent); // 传递审核的内容
        navigation.setParams({ shouldPublish: undefined, reviewedContent: undefined });
      }

      // 处理审核反馈
      if (route.params?.reviewFeedback) {
        showError(`审核未通过：${route.params.reviewFeedback}`);
        navigation.setParams({ reviewFeedback: undefined });
      }
    });
    return unsubscribe;
  }, [navigation, route.params, refreshUser]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);


  //图片预览
  const openPreview = (index) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  };

  const closePreview = () => setPreviewVisible(false);

  const handleMoodSelect = (moodValue) => {
    setSelectedMood(moodValue);
  };


  const handleImagePick = () => {
    if (selectedImages.length >= maxImages) {
      showWarning(`最多只能上传${maxImages}张图片`);
      return;
    }

    Alert.alert(
      '选择图片',
      '请选择图片来源',
      [
        { text: '取消', style: 'cancel' },
        { text: '相册', onPress: pickImageFromLibrary },
        { text: '拍照', onPress: pickImageFromCamera },
      ]
    );
  };

  const pickImageFromLibrary = async () => {
    try {
      // 请求相册权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('需要相册权限才能选择图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        const canSelect = maxImages - selectedImages.length;

        if (canSelect < 0) {
          showWarning(`最多只能上传${maxImages}张图片`);
        }

        if (result.assets.length > canSelect) {
          showWarning(`已自动选择前${canSelect}张图片`)
        }
        const newAssets = result.assets.slice(0, canSelect);
        newAssets.forEach(asset => addImageToSelection(asset.uri));
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      showError('选择图片失败，请重试');
    }
  };

  const pickImageFromCamera = async () => {
    try {
      // 请求相机权限
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showError('需要相机权限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        addImageToSelection(result.assets[0].uri);
      }
    } catch (error) {
      console.error('拍照失败:', error);
      showError('拍照失败，请重试');
    }
  };

  const addImageToSelection = (uri) => {
    if (selectedImages.length >= maxImages) {
      showWarning(`最多只能上传${maxImages}张图片`);
      return;
    }
    const newImage = {
      id: uuidv4({ random: Crypto.getRandomBytes(16) }),
      uri: uri,
      isLocal: true, // 标记为本地图片，需要上传
    };
    setSelectedImages(prev => [...prev, newImage]);
  };

  const handleImageRemove = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handlePublish = async () => {
    if (!valid) {
      showError('请输入内容后再发布');
      return;
    }

    if (!isLoggedIn) {
      showError('请先登录');
      return;
    }

    // 跳转到审核界面，传递帖子内容
    navigation.navigate('PostReview', {
      postContent: text.trim(),
      isEdit: false,
    });
  };

  // 新增：实际发布函数（从审核界面返回后调用）
  const handleActualPublish = async (reviewedContent) => {
    setUploading(true);

    try {
      let finalImages = [];

      // 如果有本地图片，先上传
      const localImages = selectedImages.filter(img => img.isLocal);
      if (localImages.length > 0) {
        const { uploadPostImages } = await import('../services/onlineOnlyStorage');
        const uploadResult = await uploadPostImages(localImages.map(img => img.uri));

        if (uploadResult.success) {
          finalImages = uploadResult.images;
        } else {
          throw new Error('图片上传失败');
        }
      }

      // 添加非本地图片（如果有的话）
      const nonLocalImages = selectedImages.filter(img => !img.isLocal);
      finalImages = [...finalImages, ...nonLocalImages];

      // 从正文中提取标签
      const contentToUse = reviewedContent || text.trim(); // 优先使用审核通过的内容
      const extractedTags = extractTagsFromText(contentToUse);

      const postData = {
        content: contentToUse, // 使用审核通过的内容
        mood: selectedMood,
        tags: extractedTags,
        images: finalImages,
        isAnonymous,
        isPublic
      };

      await createPost(postData);

      showSuccess('发布成功！');

      // 清空表单
      setText('');
      setCharCount(0);
      setSelectedMood('');
      setSelectedTags([]);
      setSelectedImages([]);
      setIsAnonymous(false);
      setIsPublic(true);

      // 延迟返回首页并刷新
      setTimeout(() => {
        navigation.navigate('Tabs', { shouldRefresh: true });
      }, 1000);
    } catch (error) {
      console.error('发布失败:', error);
      showError(error.message || '发布失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface, paddingTop: 30 }}>

        {/* 现代化顶部区域 */}
        <View style={{
          backgroundColor: COLORS.surface,
          paddingTop: 20,
          paddingBottom: 15,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.borderLight,
        }}>
          <Text style={{
            fontSize: 28,
            fontWeight: '800',
            color: COLORS.text,
            letterSpacing: -0.5,
            marginBottom: 2,
          }}>
            发布动态
          </Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: COLORS.bg }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            bounces={true}
            scrollEventThrottle={16}
          >
            {/* 顶部用户信息 */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: COLORS.surface,
            }}>
              <Avatar
                size={44}
                name={isAnonymous ? '匿名用户' : (user?.name || '我')}
                uri={isAnonymous ? '' : user?.avatar}
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.text
                }}>
                  {isAnonymous ? '匿名用户' : (user?.name || '我')}
                </Text>
                <Text style={{
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  marginTop: 2
                }}>
                  正在发布到社区
                </Text>
              </View>
            </View>

            {/* 主要输入区域 */}
            <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
              <TextInput
                value={text}
                onChangeText={handleChange}
                placeholder="分享此刻的想法、感受或故事..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                textAlignVertical="top"
                blurOnSubmit={false}
                style={{
                  color: COLORS.text,
                  fontSize: 14,
                  lineHeight: 26,
                  padding: 20,
                  minHeight: 300,
                  backgroundColor: '#fff',
                }} />


              {/* 新位置：标签区域移到内容下方，底部工具栏上方 */}
              {(loading || tags.length > 0) && (
                <View style={{
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  backgroundColor: COLORS.surface,
                }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: COLORS.text,
                      }}>
                        {showLocalTags ? '常用标签' : '推荐标签'}
                      </Text>
                      {loading && (
                        <View style={{
                          marginLeft: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                          <ActivityIndicator size="small" color={COLORS.primary} />
                          <Text style={{
                            fontSize: 12,
                            color: COLORS.textMuted,
                            marginLeft: 6,
                          }}>
                            智能分析中...
                          </Text>
                        </View>
                      )}
                      {requestTimeout && (
                        <View style={{
                          marginLeft: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                          <Text style={{
                            fontSize: 12,
                            color: COLORS.warning,
                          }}>
                            ⏱️ 请求超时
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 刷新按钮 */}
                    {(requestTimeout || showLocalTags) && text.trim().length >= 10 && (
                      <Pressable
                        onPress={handleRefreshTags}
                        style={{
                          backgroundColor: COLORS.primaryLight,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{
                          fontSize: 12,
                          color: COLORS.primary,
                          fontWeight: '600',
                        }}>
                          🔄 重试
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {loading ? (
                      // 显示加载骨架屏
                      Array.from({ length: 4 }).map((_, idx) => (
                        <TagSkeleton key={`skeleton-${idx}`} delay={idx * 100} />
                      ))
                    ) : (
                      // 显示实际标签
                      tags.map((tag, idx) => (
                        <TagBubble
                          key={tag}
                          tag={tag}
                          selected={false}
                          onPress={toggleTag}
                          delay={idx * 80}
                        />
                      ))
                    )}
                  </View>

                  {!loading && tags.length === 0 && text.trim().length > 10 && !showLocalTags && (
                    <View style={{
                      alignItems: 'center',
                      paddingVertical: 12,
                    }}>
                      <Text style={{
                        fontSize: 13,
                        color: COLORS.textMuted,
                        textAlign: 'center',
                        marginBottom: 8,
                      }}>
                        💡 暂无推荐标签，继续输入内容试试
                      </Text>
                      <Pressable
                        onPress={handleRefreshTags}
                        style={{
                          backgroundColor: COLORS.borderLight,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 16,
                        }}
                      >
                        <Text style={{
                          fontSize: 12,
                          color: COLORS.textSecondary,
                          fontWeight: '600',
                        }}>
                          🔄 重新获取
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* 显示状态提示 */}
                  {showLocalTags && (
                    <View style={{
                      backgroundColor: COLORS.bg,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      marginTop: 8,
                    }}>
                      <Text style={{
                        fontSize: 12,
                        color: COLORS.textMuted,
                        textAlign: 'center',
                      }}>
                        {requestTimeout
                          ? '⏱️ 智能推荐超时，显示常用标签'
                          : text.trim().length < 10
                            ? '💡 输入更多内容获取智能推荐'
                            : '📝 显示常用标签，点击重试获取智能推荐'
                        }
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* 底部工具栏 */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: COLORS.surface,
              }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {/* 匿名开关 */}
                  <Pressable
                    onPress={() => setIsAnonymous(!isAnonymous)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isAnonymous ? COLORS.primaryLight : COLORS.bg,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      color: isAnonymous ? COLORS.primary : COLORS.textMuted,
                      fontWeight: '600'
                    }}>
                      {isAnonymous ? '🎭 匿名' : '👤 不匿名'}
                    </Text>
                  </Pressable>
                  {/* 公开开关 */}
                  <Pressable
                    onPress={() => setIsPublic(!isPublic)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isPublic ? COLORS.primaryLight : COLORS.bg,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      color: isPublic ? COLORS.primary : COLORS.textMuted,
                      fontWeight: '600'
                    }}>
                      {isPublic ? '🌍 公开' : '🔒 私密'}
                    </Text>
                  </Pressable>
                </View>

                {/* 字数统计 */}
                <Text style={{
                  color: charCount > maxChars * 0.8 ? COLORS.warning : COLORS.textMuted,
                  fontSize: 13,
                  fontWeight: '500'
                }}>
                  {charCount}/{maxChars}
                </Text>
              </View>
            </View>

            {/* 图片上传区域 */}
            <View style={{
              backgroundColor: COLORS.surface,
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: selectedImages.length > 0 ? 20 : 0
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: COLORS.text
                }}>
                  添加图片 {selectedImages.length > 0 && `(${selectedImages.length}/${maxImages})`}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '50%', justifyContent: 'space-around' }}>
                  <Pressable
                    onPress={pickImageFromLibrary}
                    style={{
                      backgroundColor: COLORS.borderLight,
                      paddingHorizontal: 15,
                      paddingVertical: 10,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ fontSize: 14, textAlign: 'center' }}>相册</Text>
                  </Pressable>
                  <Pressable
                    onPress={pickImageFromCamera}
                    style={{
                      backgroundColor: COLORS.borderLight,
                      paddingHorizontal: 15,
                      paddingVertical: 10,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ fontSize: 14, textAlign: 'center' }}>拍照</Text>
                  </Pressable>
                </View>
              </View>

              {/* 图片预览 */}
              {selectedImages.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                  style={{ paddingTop: 10, paddingBottom: 10 }}
                >
                  {selectedImages.map((image, idx) => (
                    <View key={image.id} style={{ position: 'relative' }}>
                      {/* 缩略图（点击可预览） */}
                      <Pressable onPress={() => openPreview(idx)}>
                        <Image
                          source={{ uri: image.uri }}
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 12,
                            backgroundColor: COLORS.borderLight,
                          }}
                        />
                      </Pressable>

                      {/* 删除按钮 */}
                      <Pressable
                        onPress={() => handleImageRemove(image.id)}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: COLORS.error,
                          borderRadius: 14,
                          width: 28,
                          height: 28,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: COLORS.shadow,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          elevation: 4,
                        }}
                      >
                        <Text style={{ color: COLORS.surface, fontSize: 14, fontWeight: 'bold' }}>
                          ✕
                        </Text>
                      </Pressable>
                    </View>
                  ))}

                  {/* 添加更多图片按钮 */}
                  {selectedImages.length < maxImages && (
                    <Pressable
                      onPress={handleImagePick}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: COLORS.border,
                        borderStyle: 'dashed',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: COLORS.bg
                      }}
                    >
                      <Text style={{ fontSize: 28, color: COLORS.textMuted }}>+</Text>
                      <Text style={{
                        fontSize: 11,
                        color: COLORS.textMuted,
                        marginTop: 4,
                        fontWeight: '500'
                      }}>
                        添加
                      </Text>
                    </Pressable>
                  )}
                </ScrollView>
              )}
            </View>

            {/* 心情选择 */}
            <View style={{
              backgroundColor: COLORS.surface,
              paddingHorizontal: 20,
              paddingVertical: 16,
              // borderBottomWidth: 1,
              // borderColor: COLORS.borderLight,
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.text,
                marginBottom: 12
              }}>
                此刻状态 {selectedMood && `· ${selectedMood}`}
              </Text>
              <Dropdown
                options={moods}
                value={selectedMood}
                onSelect={handleMoodSelect}
                placeholder="你现在是什么状态"
              />
            </View>

            {/* 提示信息 */}
            <View style={{
              backgroundColor: '#fff',
              paddingHorizontal: 20,
              paddingVertical: 16,
            }}>
              <Text style={{
                color: COLORS.textMuted,
                fontSize: 13,
                lineHeight: 18,
                textAlign: 'center'
              }}>
                💡 内容将在审核后发布到社区
              </Text>
            </View>

            {/* 操作按钮 */}
            <View style={{
              flexDirection: 'row',
              gap: 12,
              paddingHorizontal: 20,
              paddingVertical: 20,
              backgroundColor: COLORS.surface,
              borderTopWidth: 1,
              borderColor: COLORS.borderLight,
            }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="取消"
                  variant="secondary"
                  onPress={() => navigation.goBack()}
                  disabled={uploading}
                />
              </View>
              <View style={{ flex: 2 }}>
                <Button
                  title={uploading ? '发布中...' : `审核并发布${selectedMood ? ` · ${selectedMood}` : ''}`}
                  variant="primary"
                  onPress={handlePublish}
                  disabled={!valid || uploading}
                />
              </View>
            </View>
          </ScrollView>


        </KeyboardAvoidingView>

      </SafeAreaView>

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}   // 安卓返回键
      >
        <ImageViewer
          imageUrls={selectedImages.map(img => ({ url: img.uri }))}
          index={previewIndex}
          enableSwipeDown
          onSwipeDown={() => setPreviewVisible(false)}      // 下滑关闭
          onClick={() => setPreviewVisible(false)}          // 单击关闭
          saveToLocalByLongPress={false}
          renderIndicator={() => null} // 去掉默认页码，自己可再定制
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  tagButton: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
  },
  tagTextSelected: {
    color: COLORS.surface,
  },
  checkMark: {
    fontSize: 12,
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    flex: 1,
    marginRight: 8,
  },
  closeButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    marginLeft: 8,
  },
  clearButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
})
