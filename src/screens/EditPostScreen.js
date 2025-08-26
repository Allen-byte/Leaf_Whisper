import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    Modal,
    Pressable,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useToastContext } from '../contexts/ToastContext';
import { getPostForEdit, updatePost } from '../services/onlineOnlyStorage';
import { useUser } from '../contexts/UserContext';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImageViewer from 'react-native-image-zoom-viewer';
import { v4 as uuidv4 } from 'uuid';
import * as Crypto from 'expo-crypto';
import { SERVER_BASE_URL } from '../config/env';


const EditPostScreen = ({ navigation, route }) => {
    const { postId } = route.params;
    const { user } = useUser();
    // 修改这一行，添加showWarning
    const { showSuccess, showError, showWarning } = useToastContext();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState('');
    const [mood, setMood] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isPublic, setIsPublic] = useState(true);
    const [avatar, setAvatar] = useState('');
    const [updatedAt, setUpdatedAt] = useState('');
    const [createdAt, setCreatedAt] = useState('');


    // 图片预览
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);

    const moods = [
        { value: '社死', emoji: '🤡', label: '社死', color: '#FF4500' },
        { value: '摸鱼', emoji: '🐟', label: '摸鱼才是生活真谛', color: '#40E0D0' },
        { value: '躺尸', emoji: '🛌', label: '躺尸待机', color: '#2F4F4F' },
        { value: '裂开', emoji: '💔', label: '服了，真的', color: '#A52A2A' },
        { value: ' 卷不动 ', emoji: '💤', label: '卷起来', color: '#D3D3D3' },
        { value: ' 社恐 ', emoji: '🙈', label: ' 社交不了一点 ', color: '#87CEEB' },
        { value: 'emo', emoji: '🌧️', label: '...', color: '#4682B4' },
        { value: ' 破防 ', emoji: '💧', label: ' 破防了 ', color: '#00BFFF' },
        { value: ' 上头 ', emoji: '🍻', label: '上头中', color: '#DC143C' },
        { value: ' 躺平 ', emoji: '🪑', label: '躺平', color: '#5F9EA0' },
        { value: ' 摆烂 ', emoji: '📺', label: '摆烂', color: '#696969' },
    ];

    useEffect(() => {
        loadPostData();
    }, []);

    useEffect(() => {
    }, [selectedImages]);

    // 处理审核结果
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            // 处理审核通过后的保存
            if (route.params?.shouldSave) {
                handleActualSave();
                navigation.setParams({ shouldSave: undefined });
            }
            
            // 处理审核反馈
            if (route.params?.reviewFeedback) {
                showError(`审核未通过：${route.params.reviewFeedback}`);
                navigation.setParams({ reviewFeedback: undefined });
            }
        });
        return unsubscribe;
    }, [navigation, route.params]);

    const maxImages = 5;

    //图片预览
    const openPreview = (index) => {
        setPreviewIndex(index);
        setPreviewVisible(true);
    };

    const closePreview = () => setPreviewVisible(false);


    const loadPostData = async () => {
        try {
            setLoading(true);
            const response = await getPostForEdit(postId);

            if (response.success) {
                const post = response.data;
                setContent(post.content);
                setMood(post.mood || '');
                setSelectedTags(post.tags || []);
                setUpdatedAt(post.updatedAt);
                setCreatedAt(post.createdAt);
                // 为服务器图片添加 isLocal: false 标记
                const serverImages = (post.images || []).map(img => ({
                    ...img,
                    isLocal: false // 标记为服务器图片，不需要上传
                }));
                setSelectedImages(serverImages);
                setIsAnonymous(post.isAnonymous);
                setIsPublic(post.isPublic);
                setAvatar(post.avatar);
            } else {
                showError('获取帖子信息失败');
                navigation.goBack();
            }
        } catch (error) {
            console.error('加载帖子数据失败:', error);
            showError('获取帖子信息失败');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
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
                quality: 0.6,
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

    const extractTagsFromText = (text) => {
        const tagRegex = /#([^\s#]+)/g;
        const matches = [];
        let match;

        while ((match = tagRegex.exec(text)) !== null) {
            const tagName = match[1];
            if (!matches.includes(tagName)) {
                matches.push(tagName);
            }
        }

        return matches;
    };

    const handleSave = async () => {
        if (!content.trim()) {
            showError('请输入帖子内容');
            return;
        }

        // 跳转到审核界面，传递帖子内容和ID
        navigation.navigate('PostReview', {
            postContent: content.trim(),
            postId: postId,
            isEdit: true,
        });
    };

    // 新增：实际保存函数（从审核界面返回后调用）
    const handleActualSave = async () => {
        try {
            setSaving(true);
            let finalImages = [];

            // 分离本地图片和服务器图片
            const localImages = selectedImages.filter(img => img.isLocal);
            const serverImages = selectedImages.filter(img => !img.isLocal);

            // 如果有本地图片，先上传
            if (localImages.length > 0) {
                const { uploadPostImages } = await import('../services/onlineOnlyStorage');
                const uploadResult = await uploadPostImages(localImages.map(img => img.uri));

                if (uploadResult.success) {
                    // 确保上传结果的格式正确
                    finalImages = [...finalImages, ...uploadResult.images];
                } else {
                    throw new Error(uploadResult.error || '图片上传失败');
                }
            }

            // 添加保留的服务器图片（确保格式一致）
            const formattedServerImages = serverImages.map(img => ({
                id: img.id,
                uri: img.uri,
            }));

            finalImages = [...finalImages, ...formattedServerImages];

            const postData = {
                content: content.trim(),
                mood: mood || null,
                tags: extractTagsFromText(content),
                images: finalImages,
                isAnonymous,
                isPublic
            };

            const response = await updatePost(postId, postData);
            if (response.success) {
                showSuccess('帖子更新成功');
                // 导航回我的帖子页面并传递刷新参数
                navigation.navigate('MyPosts', { shouldRefresh: true });
            } else {
                console.error('更新失败响应:', response);
                showError(response.error || '更新失败');
            }
        } catch (error) {
            console.error('更新帖子失败:', error);
            showError(error.message || '更新失败，请重试');
        } finally {
            setSaving(false);
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                aspect: [4, 3],
                quality: 0.6,
            });

            if (!result.canceled && result.assets[0]) {
                addImageToSelection(result.assets[0].uri); // 使用现有函数，自动添加 isLocal: true
            }
        } catch (error) {
            console.error('选择图片失败:', error);
            showError('选择图片失败');
        }
    };

    const removeImage = (imageId) => {
        setSelectedImages(prev => prev.filter(img => img.id !== imageId));
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{
                        marginTop: 16,
                        color: COLORS.textSecondary,
                        fontSize: 16,
                        fontWeight: '500'
                    }}>
                        加载中...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.surface }}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
                        {/* 现代化顶部区域 */}
                        <View style={{
                            backgroundColor: COLORS.surface,
                            paddingTop: 20,
                            paddingBottom: 15,
                            paddingHorizontal: 20,
                            borderBottomWidth: 1,
                            borderBottomColor: COLORS.borderLight,
                            shadowColor: COLORS.shadow,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <TouchableOpacity
                                    onPress={() => navigation.goBack()}
                                    style={{
                                        padding: 8,
                                        borderRadius: 20,
                                        backgroundColor: COLORS.bg,
                                    }}
                                >
                                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                                </TouchableOpacity>

                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: '800',
                                    color: COLORS.text,
                                }}>
                                    编辑帖子
                                </Text>
                            </View>
                        </View>

                        <KeyboardAvoidingView
                            style={{ flex: 1 }}
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                        >
                            <ScrollView
                                style={{ flex: 1 }}
                                contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                keyboardDismissMode="interactive"
                                bounces={true}
                                scrollEventThrottle={1}
                                decelerationRate="fast"
                            >
                                {/* 用户信息卡片 */}
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 20,
                                    paddingVertical: 16,
                                    backgroundColor: COLORS.surface,
                                    marginHorizontal: 16,
                                    marginTop: 8,
                                    borderRadius: 16,
                                    elevation: 3,
                                }}>
                                    <Avatar
                                        size={48}
                                        name={isAnonymous ? '匿名用户' : (user?.name)}
                                        uri={isAnonymous ? '' : avatar}
                                        style={{ marginRight: 12 }}
                                    />
                                    <View>
                                        <Text style={{
                                            fontSize: 17,
                                            fontWeight: '700',
                                            color: COLORS.text
                                        }}>
                                            {isAnonymous ? '匿名用户' : (user?.name || '我')}
                                        </Text>
                                        <Text style={{
                                            fontSize: 14,
                                            color: COLORS.textSecondary,
                                            marginTop: 2
                                        }}>
                                            正在编辑帖子
                                        </Text>

                                    </View>
                                </View>

                                {/* 内容输入区域 */}
                                <View style={{
                                    backgroundColor: COLORS.surface,
                                    marginHorizontal: 16,
                                    marginTop: 8,
                                    borderRadius: 16,
                                    shadowColor: COLORS.shadow,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 3,
                                }}>
                                    <TextInput
                                        style={{
                                            fontSize: 14,
                                            color: COLORS.text,
                                            lineHeight: 20,
                                            minHeight: 160,
                                            textAlignVertical: 'top',
                                            paddingHorizontal: 20,
                                            padding: 20,
                                        }}
                                        placeholder="分享此刻的想法、感受或故事..."
                                        placeholderTextColor={COLORS.textMuted}
                                        multiline
                                        value={content}
                                        onChangeText={setContent}
                                        blurOnSubmit={false}
                                    />

                                    {/* 字数统计和编辑时间展示 */}
                                    <View style={{

                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        paddingHorizontal: 20,
                                        paddingBottom: 16,
                                    }}>
                                        <View>
                                            <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>
                                                上次编辑于{updatedAt ? new Date(updatedAt).toLocaleString() : new Date(createdAt).toLocaleString()}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={{
                                                color: content.length > 400 ? COLORS.warning : COLORS.textMuted,
                                                fontSize: 12,
                                                fontWeight: '500'
                                            }}>
                                                {content.length}/500
                                            </Text>
                                        </View>

                                    </View>
                                </View>

                                {/* 心情选择 */}
                                <View style={{
                                    backgroundColor: COLORS.surface,
                                    marginHorizontal: 16,
                                    marginTop: 8,
                                    borderRadius: 16,
                                    padding: 20,
                                    shadowColor: COLORS.shadow,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 3,
                                }}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '700',
                                        color: COLORS.text,
                                        marginBottom: 16
                                    }}>
                                        此刻状态 {mood && `· ${mood}`}
                                    </Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ paddingRight: 20 }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => setMood('')}
                                            style={{
                                                paddingHorizontal: 16,
                                                paddingVertical: 10,
                                                borderRadius: 24,
                                                backgroundColor: mood === '' ? COLORS.primary : COLORS.bg,
                                                marginRight: 12,
                                                borderWidth: mood === '' ? 0 : 1,
                                                borderColor: COLORS.border,
                                            }}
                                        >
                                            <Text style={{
                                                color: mood === '' ? COLORS.surface : COLORS.text,
                                                fontWeight: '600',
                                                fontSize: 14
                                            }}>
                                                😐 无状态
                                            </Text>
                                        </TouchableOpacity>
                                        {moods.map((moodItem) => (
                                            <TouchableOpacity
                                                key={moodItem.value}
                                                onPress={() => setMood(moodItem.value)}
                                                style={{
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 10,
                                                    borderRadius: 24,
                                                    backgroundColor: mood === moodItem.value ? COLORS.primary : COLORS.bg,
                                                    marginRight: 12,
                                                    borderWidth: mood === moodItem.value ? 0 : 1,
                                                    borderColor: COLORS.border,
                                                }}
                                            >
                                                <Text style={{
                                                    color: mood === moodItem.value ? COLORS.surface : COLORS.text,
                                                    fontWeight: '600',
                                                    fontSize: 14
                                                }}>
                                                    {moodItem.emoji} {moodItem.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* 图片管理 */}
                                <View style={{
                                    backgroundColor: COLORS.surface,
                                    marginHorizontal: 16,
                                    marginTop: 8,
                                    borderRadius: 16,
                                    padding: 18,
                                    shadowColor: COLORS.shadow,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 3,
                                }}>
                                    <View style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: selectedImages.length > 0 ? 20 : 0
                                    }}>
                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: '700',
                                            color: COLORS.text
                                        }}>
                                            图片 {selectedImages.length > 0 && `(${selectedImages.length}/${maxImages})`}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <Pressable
                                                onPress={pickImageFromLibrary}
                                                style={{
                                                    backgroundColor: COLORS.primaryLight,
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 8,
                                                    borderRadius: 20,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Ionicons name="images" size={18} color={COLORS.primary} />
                                            </Pressable>
                                            <Pressable
                                                onPress={pickImageFromCamera}
                                                style={{
                                                    backgroundColor: COLORS.primaryLight,
                                                    paddingHorizontal: 8,
                                                    paddingVertical: 8,
                                                    borderRadius: 20,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Ionicons name="camera" size={18} color={COLORS.primary} />
                                            </Pressable>
                                        </View>
                                    </View>

                                    {selectedImages.length > 0 && (
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={{ gap: 12 }}
                                            style={{ paddingBottom: 10, paddingTop: 10 }}
                                        >
                                            {selectedImages.map((image, idx) => (
                                                <View key={image.id} style={{ position: 'relative' }}>
                                                    <Pressable onPress={() => openPreview(idx)}>
                                                        {image.uri.startsWith("/uploads/") ? (
                                                            <Image
                                                                source={{ uri: `${SERVER_BASE_URL}${image.uri}` }}
                                                                style={{
                                                                    width: 100,
                                                                    height: 100,
                                                                    borderRadius: 12,
                                                                    backgroundColor: COLORS.borderLight,
                                                                }}
                                                            />
                                                        ) : (
                                                            <Image
                                                                source={{ uri: image.uri }}
                                                                style={{
                                                                    width: 100,
                                                                    height: 100,
                                                                    borderRadius: 12,
                                                                    backgroundColor: COLORS.borderLight,
                                                                }}
                                                            />
                                                        )}
                                                    </Pressable>

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
                                                            shadowOpacity: 0.3,
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

                                    {selectedImages.length === 0 && (
                                        <View style={{
                                            alignItems: 'center',
                                            paddingVertical: 32,
                                            backgroundColor: COLORS.bg,
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            borderColor: COLORS.border,
                                            borderStyle: 'dashed',
                                            marginTop: 10
                                        }}>
                                            <Ionicons name="images-outline" size={48} color={COLORS.textMuted} />
                                            <Text style={{
                                                color: COLORS.textMuted,
                                                fontSize: 14,
                                                marginTop: 12,
                                                fontWeight: '500'
                                            }}>
                                                暂无图片，点击上方按钮添加
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* 发布设置 */}
                                <View style={{
                                    backgroundColor: COLORS.surface,
                                    marginHorizontal: 16,
                                    marginTop: 8,
                                    borderRadius: 16,
                                    padding: 20,
                                    shadowColor: COLORS.shadow,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 3,
                                }}>
                                    <Text style={{
                                        fontSize: 16,
                                        fontWeight: '700',
                                        color: COLORS.text,
                                        marginBottom: 16
                                    }}>
                                        发布设置
                                    </Text>

                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        gap: 12
                                    }}>
                                        <TouchableOpacity
                                            onPress={() => setIsAnonymous(!isAnonymous)}
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: isAnonymous ? COLORS.primary : COLORS.bg,
                                                paddingHorizontal: 16,
                                                paddingVertical: 14,
                                                borderRadius: 24,
                                                borderWidth: isAnonymous ? 0 : 1,
                                                borderColor: COLORS.border,
                                            }}
                                        >
                                            <Text style={{
                                                color: isAnonymous ? COLORS.surface : COLORS.text,
                                                fontWeight: '600',
                                                fontSize: 15
                                            }}>
                                                {isAnonymous ? '🎭 匿名' : '👤 实名'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={() => setIsPublic(!isPublic)}
                                            style={{
                                                flex: 1,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: isPublic ? COLORS.primary : COLORS.bg,
                                                paddingHorizontal: 16,
                                                paddingVertical: 14,
                                                borderRadius: 24,
                                                borderWidth: isPublic ? 0 : 1,
                                                borderColor: COLORS.border,
                                            }}
                                        >
                                            <Text style={{
                                                color: isPublic ? COLORS.surface : COLORS.text,
                                                fontWeight: '600',
                                                fontSize: 15
                                            }}>
                                                {isPublic ? '🌍 公开' : '🔒 私密'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* 提示信息 */}
                                <View style={{
                                    backgroundColor: COLORS.bg,
                                    marginHorizontal: 16,
                                    marginTop: 8,
                                    paddingVertical: 16,
                                }}>
                                    <Text style={{
                                        color: COLORS.textMuted,
                                        fontSize: 13,
                                        lineHeight: 18,
                                        textAlign: 'center'
                                    }}>
                                        💡 编辑后的内容将重新审核，请确保内容真实友善
                                    </Text>
                                </View>

                                {/* 底部操作按钮 */}
                                <View style={{
                                    flexDirection: 'row',
                                    gap: 12,
                                    paddingHorizontal: 20,
                                    paddingVertical: 20,
                                    backgroundColor: COLORS.surface,
                                    marginHorizontal: 16,
                                    marginTop: 8,
                                    marginBottom: 20,
                                    borderRadius: 16,
                                    shadowColor: COLORS.shadow,
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 3,
                                }}>
                                    <View style={{ flex: 1 }}>
                                        <Button
                                            title="取消"
                                            variant="secondary"
                                            onPress={() => navigation.goBack()}
                                            disabled={saving}
                                        />
                                    </View>
                                    <View style={{ flex: 2 }}>
                                        <Button
                                            title={saving ? '保存中...' : `审核并保存${mood ? ` · ${mood}` : ''}`}
                                            variant="primary"
                                            onPress={handleSave}
                                            disabled={!content.trim() || saving}
                                        />
                                    </View>
                                </View>
                            </ScrollView>
                        </KeyboardAvoidingView>
                    </View>
                </ScrollView>
            </TouchableWithoutFeedback>
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
        </SafeAreaView>
    );
};

export default EditPostScreen;