import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { COLORS } from '../theme/colors';
import { createPost, fetchTags } from '../services/onlineOnlyStorage';
import { useToastContext } from '../contexts/ToastContext';
import { useUser } from '../contexts/UserContext';
import * as ImagePicker from 'expo-image-picker';
import ImageViewer from 'react-native-image-zoom-viewer';
import * as Crypto from 'expo-crypto';
import { v4 as uuidv4 } from 'uuid';
import { moods } from '../theme/moods';

const { width, height } = Dimensions.get('window');

// 从文本中提取标签的函数
const extractTagsFromText = (text) => {
  if (!text || typeof text !== 'string') return [];
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

// 莫兰迪风格标签组件
const ModernTagBubble = ({ tag, onPress, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      })
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        marginRight: 10,
        marginBottom: 10,
      }}
    >
      <TouchableOpacity
        onPress={() => onPress(tag)}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.8)',
          shadowColor: 'rgba(0,0,0,0.08)',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#8B7355',
          }}
        >
          #{tag}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// 标签加载骨架屏
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
        marginRight: 10,
        marginBottom: 10,
        opacity: shimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.4, 0.8],
        }),
      }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 20,
          backgroundColor: 'rgba(255,255,255,0.6)',
          width: Math.random() * 60 + 80,
          height: 40,
        }}
      />
    </Animated.View>
  );
};

export const CreateScreen = ({ navigation, route }) => {
  const [text, setText] = useState('');
  const [charCount, setCharCount] = useState(0);
  
  // 每日任务相关状态
  const [isFromDailyTask, setIsFromDailyTask] = useState(false);
  const [dailyTaskData, setDailyTaskData] = useState(null);
  const [selectedMood, setSelectedMood] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tagsCache, setTagsCache] = useState(new Map());
  const [showLocalTags, setShowLocalTags] = useState(false);
  const [requestTimeout, setRequestTimeout] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const insets = useSafeAreaInsets();

  const fetchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const requestTimeoutRef = useRef(null);

  const { showError, showSuccess, showWarning } = useToastContext();
  const { user, isLoggedIn, refreshUser } = useUser();

  const maxChars = 500;
  const maxImages = 5;
  const valid = text.trim().length > 0;



  // 本地预设标签
  const localTags = [
    '日常', '心情', '分享', '生活', '工作', '学习',
    '感悟', '随想', '吐槽', '开心', '困惑', '成长',
    '美食', '旅行', '读书', '电影', '音乐', '运动'
  ];

  // 处理文本变化
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

    if (!newText.trim()) {
      setTags([]);
      setLoading(false);
      return;
    }

    if (newText.trim().length < 10) {
      setTags(localTags.slice(0, 6));
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

    // 防抖请求
    fetchTimeoutRef.current = setTimeout(() => {
      handleFetchTags(newText.trim());
    }, 2000);
  }, [tagsCache, localTags]);

  const handleFetchTags = async (content) => {
    if (!content) return;

    setLoading(true);
    setShowLocalTags(false);
    setRequestTimeout(false);

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    requestTimeoutRef.current = setTimeout(() => {
      if (!signal.aborted) {
        setRequestTimeout(true);
        setLoading(false);
        setTags(localTags.slice(0, 8));
        setShowLocalTags(true);
      }
    }, 10000);

    try {
      const { data } = await fetchTags(content, { signal });
      const jsonData = JSON.parse(data);

      if (signal.aborted) return;

      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }

      const fetchedTags = jsonData;

      if (fetchedTags.length > 0) {
        setTags(fetchedTags);
        setShowLocalTags(false);
        const cacheKey = content.toLowerCase();
        setTagsCache(prev => new Map(prev.set(cacheKey, fetchedTags)));
      } else {
        setTags(localTags.slice(0, 6));
        setShowLocalTags(true);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('获取标签失败:', error);
      setTags(localTags.slice(0, 6));
      setShowLocalTags(true);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  const toggleTag = (tag) => {
    const currentText = text;
    const lastChar = currentText.slice(-1);
    let tagText;
    if (lastChar === '#') {
      tagText = `${tag} `;
    } else {
      tagText = `#${tag} `;
    }
    setText(prev => prev + tagText);
    setCharCount(prev => prev + tagText.length);
  };

  // 图片选择
  const pickImageFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('需要相册权限才能选择图片');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        const canSelect = maxImages - selectedImages.length;
        if (canSelect <= 0) {
          showWarning(`最多只能上传${maxImages}张图片`);
          return;
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
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showError('需要相机权限才能拍照');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
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
      isLocal: true,
    };
    setSelectedImages(prev => [...prev, newImage]);
  };

  const handleImageRemove = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const openPreview = (index) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
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

    if (charCount > maxChars) {
      showError(`内容超出字数限制，请控制在${maxChars}字以内`);
      return;
    }

    const postDataToSend = {
      content: text.trim(),
      mood: selectedMood,
      tags: extractTagsFromText(text.trim()),
      images: selectedImages,
      isAnonymous,
      isPublic
    };



    // 跳转到审核页面，传递完整的发布数据
    navigation.navigate('PostReview', {
      postContent: text.trim(),
      postData: postDataToSend,
      isEdit: false,
    });
  };

  // 监听页面焦点
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.shouldRefreshUser) {
        refreshUser();
        navigation.setParams({ shouldRefreshUser: undefined });
      }

      if (route.params?.shouldPublish) {
        handleActualPublish(route.params?.reviewedContent, route.params?.reviewedPostData);
        navigation.setParams({ 
          shouldPublish: undefined, 
          reviewedContent: undefined,
          reviewedPostData: undefined 
        });
      }

      if (route.params?.reviewFeedback) {
        showError(`审核未通过：${route.params.reviewFeedback}`);
        navigation.setParams({ reviewFeedback: undefined });
      }

      // 处理每日任务参数
      if (route.params?.fromDailyTask && route.params?.taskData) {
        console.log('📝 从每日任务进入创建页面:', route.params.taskData);
        setIsFromDailyTask(true);
        setDailyTaskData(route.params.taskData);
        // 可以预填充一些内容
        if (route.params.taskData.task) {
          setText(`今日小任务：${route.params.taskData.task}\n\n`);
        }
        navigation.setParams({ 
          fromDailyTask: undefined, 
          taskData: undefined 
        });
      }
    });
    return unsubscribe;
  }, [navigation, route.params, refreshUser]);

  // 实际发布函数
  const handleActualPublish = async (reviewedContent, reviewedPostData) => {
    if (uploading) return; // 防止重复提交

    setUploading(true);

    try {
      let finalImages = [];

      // 如果有审核后的完整数据，优先使用审核后的数据
      const dataToUse = reviewedPostData || {
        content: text.trim(),
        mood: selectedMood,
        tags: extractTagsFromText(text.trim()),
        images: selectedImages,
        isAnonymous,
        isPublic
      };



      // 处理本地图片上传
      const imagesToProcess = dataToUse.images || [];
      const localImages = imagesToProcess.filter(img => img.isLocal);
      if (localImages.length > 0) {
        showWarning('正在上传图片...');
        const { uploadPostImages } = await import('../services/onlineOnlyStorage');
        const uploadResult = await uploadPostImages(localImages.map(img => img.uri));

        if (uploadResult.success) {
          finalImages = uploadResult.images;
        } else {
          throw new Error(uploadResult.error || '图片上传失败');
        }
      }

      // 添加非本地图片
      const nonLocalImages = imagesToProcess.filter(img => !img.isLocal);
      finalImages = [...finalImages, ...nonLocalImages];

      const contentToUse = reviewedContent || dataToUse.content;
      const extractedTags = extractTagsFromText(contentToUse);

      const postData = {
        content: contentToUse,
        mood: dataToUse.mood,
        tags: extractedTags,
        images: finalImages,
        isAnonymous: dataToUse.isAnonymous,
        isPublic: dataToUse.isPublic
      };

      const result = await createPost(postData);

      if (result.success) {
        showSuccess('发布成功！');

        // 清空表单
        setText('');
        setCharCount(0);
        setSelectedMood('');
        setSelectedImages([]);
        setIsAnonymous(false);
        setIsPublic(true);
        setTags([]);

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          navigation.navigate('Tabs', {
            screen: 'Home',
            params: { shouldRefresh: true }
          });
        }, 1500);
      } else {
        throw new Error(result.error || '发布失败');
      }
    } catch (error) {
      console.error('发布失败:', error);
      showError(error.message || '发布失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return (
    <View style={{ flex: 1, paddingTop: 30 }}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* 莫兰迪低饱和度背景渐变 */}
      <LinearGradient
        colors={['#F5F1EB', '#E8E2D5', '#D4C4B0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* 顶部标题和发布按钮 */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}>
          <Text style={{
            fontSize: 28,
            fontWeight: '300',
            color: '#8B7355',
            letterSpacing: 1,
          }}>
            发布动态
          </Text>
          
          {/* 顶部发布按钮 */}
          <TouchableOpacity
            onPress={handlePublish}
            disabled={!valid || uploading}
            style={{
              backgroundColor: valid && !uploading ? '#8B7355' : 'rgba(139,115,85,0.3)',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: valid && !uploading ? 'rgba(0,0,0,0.2)' : 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: valid && !uploading ? 3 : 0,
            }}
          >
            {uploading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="white" />
                <Text style={{
                  color: "white",
                  fontSize: 14,
                  fontWeight: '600',
                  marginLeft: 6,
                }}>
                  发布中...
                </Text>
              </View>
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={16}
                  color={valid ? "white" : "rgba(139,115,85,0.6)"}
                />
                <Text style={{
                  color: valid ? "white" : "rgba(139,115,85,0.6)",
                  fontSize: 14,
                  fontWeight: '600',
                  marginLeft: 6,
                }}>
                  {valid ? '发布' : '发布'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            {/* 用户信息区域 */}
            <View style={{
              marginHorizontal: 20,
              marginBottom: 20,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Avatar
                  size={50}
                  name={isAnonymous ? '匿名用户' : (user?.name || '我')}
                  uri={isAnonymous ? '' : user?.avatar}
                  style={{
                    borderWidth: 2,
                    borderColor: 'rgba(255,255,255,0.9)',
                    shadowColor: 'rgba(0,0,0,0.1)',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#8B7355',
                  }}>
                    {isAnonymous ? '匿名用户' : (user?.name || '我')}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: '#A0937D',
                    marginTop: 2,
                  }}>
                    正在创作新内容
                  </Text>
                </View>
              </View>

              {/* 设置选项 */}
              <View style={{
                flexDirection: 'row',
                gap: 12,
              }}>
                <TouchableOpacity
                  onPress={() => setIsAnonymous(!isAnonymous)}
                  style={{
                    backgroundColor: isAnonymous ? 'rgba(139,115,85,0.2)' : 'rgba(255,255,255,0.7)',
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    shadowColor: 'rgba(0,0,0,0.1)',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    color: isAnonymous ? '#8B7355' : '#A0937D',
                    fontWeight: '600',
                  }}>
                    {isAnonymous ? '🎭 匿名' : '👋🏻 不匿名'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsPublic(!isPublic)}
                  style={{
                    backgroundColor: isPublic ? 'rgba(139,115,85,0.2)' : 'rgba(255,255,255,0.7)',
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    shadowColor: 'rgba(0,0,0,0.1)',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    color: isPublic ? '#8B7355' : '#A0937D',
                    fontWeight: '600',
                  }}>
                    {isPublic ? '🔓 公开' : '🔒 私密'}
                  </Text>
                </TouchableOpacity>


              </View>
            </View>

            {/* 内容输入区域 */}
            <View style={{
              marginHorizontal: 20,
              marginBottom: 20,
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: 'rgba(0,0,0,0.08)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}>
              <TextInput
                value={text}
                onChangeText={handleChange}
                placeholder="分享此刻的想法、感受或故事..."
                placeholderTextColor="#B8A082"
                multiline
                textAlignVertical="top"
                style={{
                  color: '#8B7355',
                  fontSize: 16,
                  lineHeight: 24,
                  padding: 24,
                  minHeight: 200,
                  fontWeight: '400',
                }}
              />

              {/* 字数统计 */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                paddingHorizontal: 24,
                paddingBottom: 16,
              }}>
                <Text style={{
                  color: charCount > maxChars * 0.8 ? '#D4A574' : '#B8A082',
                  fontSize: 14,
                  fontWeight: '500'
                }}>
                  {charCount}/{maxChars}
                </Text>
              </View>
            </View>

            {/* 标签推荐区域 */}
            {(loading || tags.length > 0) && (
              <View style={{
                marginHorizontal: 20,
                marginBottom: 20,
                paddingHorizontal: 4,
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: '#8B7355',
                  }}>
                    {showLocalTags ? '✨ 常用标签' : '🎯 智能推荐'}
                  </Text>
                  {loading && (
                    <View style={{
                      marginLeft: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <ActivityIndicator size="small" color="#8B7355" />
                      <Text style={{
                        fontSize: 12,
                        color: '#A0937D',
                        marginLeft: 6,
                      }}>
                        分析中...
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <TagSkeleton key={`skeleton-${idx}`} delay={idx * 100} />
                    ))
                  ) : (
                    tags.map((tag, idx) => (
                      <ModernTagBubble
                        key={tag}
                        tag={tag}
                        onPress={toggleTag}
                        delay={idx * 80}
                      />
                    ))
                  )}
                </View>
              </View>
            )}

            {/* 图片上传区域 */}
            <View style={{
              marginHorizontal: 20,
              marginBottom: 20,
              paddingHorizontal: 4,
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: selectedImages.length > 0 ? 20 : 0
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#8B7355',
                }}>
                  添加图片 {selectedImages.length > 0 && `(${selectedImages.length}/${maxImages})`}
                </Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={pickImageFromLibrary}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      shadowColor: 'rgba(0,0,0,0.1)',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      color: '#8B7355',
                      fontWeight: '600',
                    }}>
                      相册
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={pickImageFromCamera}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      borderRadius: 16,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      shadowColor: 'rgba(0,0,0,0.1)',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      color: '#8B7355',
                      fontWeight: '600',
                    }}>
                      拍照
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 图片预览 */}
              {selectedImages.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingTop: 10 }}
                >
                  {selectedImages.map((image, idx) => (
                    <View key={image.id} style={{ position: 'relative' }}>
                      <TouchableOpacity onPress={() => openPreview(idx)}>
                        <Image
                          source={{ uri: image.uri }}
                          style={{
                            width: 100,
                            height: 100,
                            borderRadius: 16,
                            backgroundColor: 'rgba(255,255,255,0.5)',
                            shadowColor: 'rgba(0,0,0,0.1)',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 3,
                          }}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleImageRemove(image.id)}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#D4A574',
                          borderRadius: 14,
                          width: 28,
                          height: 28,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: 'rgba(0,0,0,0.2)',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 4,
                        }}
                      >
                        <Ionicons name="close" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* 心情选择水平滑动 */}
            <View style={{
              marginHorizontal: 20,
              marginBottom: 20,
              paddingHorizontal: 4,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#8B7355',
                marginBottom: 16,
              }}>
                当前心情
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 4,
                  gap: 12,
                }}
              >
                {moods.map((mood) => (
                  <TouchableOpacity
                    key={mood.value}
                    onPress={() => setSelectedMood(selectedMood === mood.value ? '' : mood.value)}
                    style={{
                      backgroundColor: selectedMood === mood.value
                        ? 'rgba(139,115,85,0.2)'
                        : 'rgba(255,255,255,0.8)',
                      borderRadius: 20,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderWidth: selectedMood === mood.value ? 2 : 0,
                      borderColor: '#8B7355',
                      shadowColor: 'rgba(0,0,0,0.08)',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 3,
                      minWidth: 80,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      fontSize: 20,
                      marginBottom: 4,
                    }}>
                      {mood.emoji}
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: selectedMood === mood.value ? '#8B7355' : '#A0937D',
                      fontWeight: selectedMood === mood.value ? '600' : '500',
                      textAlign: 'center',
                    }}>
                      {mood.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

      </SafeAreaView>



      {/* 图片预览模态框 */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <ImageViewer
          imageUrls={selectedImages.map(img => ({ url: img.uri }))}
          index={previewIndex}
          enableSwipeDown
          onSwipeDown={() => setPreviewVisible(false)}
          onClick={() => setPreviewVisible(false)}
          saveToLocalByLongPress={false}
          renderIndicator={() => null}
        />
      </Modal >
    </View >
  );
};