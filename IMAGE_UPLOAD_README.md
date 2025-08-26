# 图片上传功能实现

## 概述

现在应用已经实现了完整的图片选择和上传功能，用户可以在发布帖子时选择本地图片或拍照，图片会被上传到服务器的 `uploads/posts` 目录下，数据库中只保存图片的路径。

## 主要功能

### ✅ 图片选择
- 支持从相册选择图片
- 支持拍照获取图片
- 自动请求相应权限（相册/相机）
- 支持图片编辑（裁剪、调整）

### ✅ 图片上传
- 多图片上传支持（最多5张）
- 图片压缩和优化（质量0.8）
- 唯一文件名生成（防止冲突）
- 上传进度提示

### ✅ 用户信息集成
- 在CreateScreen中显示当前用户信息
- 支持匿名发布模式
- 用户头像和昵称实时显示

## 技术实现

### 前端 (React Native)

#### 图片选择
```javascript
import * as ImagePicker from 'expo-image-picker';

// 从相册选择
const pickImageFromLibrary = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
};

// 拍照
const pickImageFromCamera = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
};
```

#### 图片上传
```javascript
// 上传多张图片
export const uploadPostImages = async (imageUris) => {
  const formData = new FormData();
  
  imageUris.forEach((uri, index) => {
    formData.append('images', {
      uri: uri,
      type: 'image/jpeg',
      name: `image_${index}.jpg`,
    });
  });
  
  const response = await ApiService.request('/posts/upload-images', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response;
};
```

#### 用户信息获取
```javascript
import { useUser } from '../contexts/UserContext';

const CreateScreen = () => {
  const { user, isLoggedIn } = useUser();
  
  return (
    <Avatar
      size={40}
      name={isAnonymous ? '匿名用户' : (user?.name || '我')}
      uri={isAnonymous ? '' : user?.avatar}
    />
  );
};
```

### 后端 (Node.js + Express)

#### Multer配置
```javascript
// 帖子图片存储配置
const postsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const postsUploadDir = path.join(__dirname, '../../uploads/posts');
    if (!fs.existsSync(postsUploadDir)) {
      fs.mkdirSync(postsUploadDir, { recursive: true });
    }
    cb(null, postsUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `post_${req.user.id}_${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

const postsUpload = multer({
  storage: postsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});
```

#### 上传处理
```javascript
// 上传帖子图片
static async handlePostImagesUpload(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '请选择要上传的图片文件' });
    }

    const imagePaths = req.files.map(file => `/uploads/posts/${file.filename}`);
    
    res.json({
      success: true,
      message: '图片上传成功',
      images: imagePaths.map((path, index) => ({
        id: `${Date.now()}_${index}`,
        uri: path
      }))
    });
  } catch (error) {
    console.error('帖子图片上传失败:', error);
    res.status(500).json({ error: '图片上传失败' });
  }
}
```

#### 路由配置
```javascript
// 图片上传路由
router.post('/upload-images', auth, UsersController.uploadPostImages, UsersController.handlePostImagesUpload);
```

## 文件结构

### 后端文件结构
```
backend/
├── uploads/
│   ├── avatars/          # 用户头像
│   └── posts/            # 帖子图片
├── src/
│   ├── controllers/
│   │   └── usersController.js  # 图片上传控制器
│   └── routes/
│       └── posts.js      # 帖子路由（包含图片上传）
```

### 前端文件结构
```
frontend/src/
├── screens/
│   └── CreateScreen.js   # 发布页面（包含图片选择）
├── services/
│   └── onlineOnlyStorage.js  # API服务（包含图片上传）
├── contexts/
│   └── UserContext.js    # 用户状态管理
└── utils/
    └── testImageUpload.js  # 图片上传测试工具
```

## 数据流程

### 图片上传流程
1. 用户在CreateScreen选择图片（相册/拍照）
2. 图片被添加到本地状态（标记为需要上传）
3. 用户点击发布按钮
4. 检查是否有本地图片需要上传
5. 调用 `uploadPostImages` API上传图片
6. 服务器保存图片到 `uploads/posts` 目录
7. 返回图片的服务器路径
8. 使用返回的路径创建帖子
9. 图片路径保存到数据库

### 用户信息获取流程
1. CreateScreen组件挂载
2. 通过 `useUser()` Hook获取当前用户信息
3. 显示用户头像和昵称
4. 支持匿名模式切换

## 配置参数

### 图片限制
- **最大文件大小**: 10MB
- **最大图片数量**: 5张
- **支持格式**: JPG, JPEG, PNG, GIF, WebP
- **图片质量**: 0.8 (80%)
- **编辑比例**: 4:3

### 文件命名规则
- **格式**: `post_{用户ID}_{时间戳}-{随机数}.{扩展名}`
- **示例**: `post_123_1703123456789-987654321.jpg`

## 权限要求

### iOS
```xml
<key>NSCameraUsageDescription</key>
<string>需要相机权限来拍照发布内容</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>需要相册权限来选择图片发布内容</string>
```

### Android
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

## 使用示例

### 在CreateScreen中获取用户信息
```javascript
import { useUser } from '../contexts/UserContext';

const CreateScreen = () => {
  const { user, isLoggedIn } = useUser();
  
  if (!isLoggedIn) {
    return <Text>请先登录</Text>;
  }
  
  return (
    <View>
      <Text>当前用户: {user.name}</Text>
      <Avatar uri={user.avatar} name={user.name} />
    </View>
  );
};
```

### 图片选择和上传
```javascript
const [selectedImages, setSelectedImages] = useState([]);
const [uploading, setUploading] = useState(false);

const handleImagePick = () => {
  Alert.alert('选择图片', '请选择图片来源', [
    { text: '取消', style: 'cancel' },
    { text: '相册', onPress: pickImageFromLibrary },
    { text: '拍照', onPress: pickImageFromCamera },
  ]);
};

const handlePublish = async () => {
  setUploading(true);
  
  try {
    // 上传本地图片
    const localImages = selectedImages.filter(img => img.isLocal);
    if (localImages.length > 0) {
      const uploadResult = await uploadPostImages(localImages.map(img => img.uri));
      // 使用上传后的图片路径创建帖子
    }
  } catch (error) {
    console.error('发布失败:', error);
  } finally {
    setUploading(false);
  }
};
```

## 错误处理

### 常见错误
1. **权限被拒绝**: 提示用户手动开启权限
2. **文件过大**: 提示用户选择较小的图片
3. **网络错误**: 提示用户检查网络连接
4. **服务器错误**: 提示用户稍后重试

### 错误提示
```javascript
try {
  const result = await uploadPostImages(imageUris);
} catch (error) {
  if (error.message.includes('权限')) {
    showError('需要相册权限才能选择图片');
  } else if (error.message.includes('大小')) {
    showError('图片文件过大，请选择小于10MB的图片');
  } else {
    showError('上传失败，请重试');
  }
}
```

## 性能优化

1. **图片压缩**: 自动压缩到80%质量
2. **异步上传**: 不阻塞UI操作
3. **进度提示**: 显示上传状态
4. **错误重试**: 支持上传失败重试
5. **内存管理**: 及时释放图片资源

## 安全考虑

1. **文件类型验证**: 只允许图片格式
2. **文件大小限制**: 防止大文件攻击
3. **用户认证**: 需要登录才能上传
4. **唯一文件名**: 防止文件名冲突
5. **路径安全**: 防止路径遍历攻击

## 测试

使用测试工具验证功能：
```javascript
import { testImageUpload } from '../utils/testImageUpload';

// 在开发环境下测试
if (__DEV__) {
  testImageUpload();
}
```

## 总结

现在的图片上传功能提供了完整的用户体验：
- ✅ 真实的图片选择（相册/拍照）
- ✅ 可靠的图片上传到服务器
- ✅ 数据库中只保存路径
- ✅ 完整的用户信息集成
- ✅ 良好的错误处理和用户反馈