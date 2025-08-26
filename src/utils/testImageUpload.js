import { uploadPostImages } from '../services/onlineOnlyStorage';

/**
 * 测试图片上传功能
 */
export const testImageUpload = async () => {
  console.log('=== 开始测试图片上传功能 ===');

  try {
    // 模拟本地图片URI（在实际应用中，这些会是从ImagePicker获取的真实URI）
    const testImageUris = [
      'file:///path/to/test/image1.jpg', // 这些是示例URI
      'file:///path/to/test/image2.jpg',
    ];

    console.log('1. 准备上传图片...');
    console.log('图片数量:', testImageUris.length);

    // 注意：这个测试需要真实的图片文件才能工作
    // 在实际使用中，URI会来自ImagePicker
    const result = await uploadPostImages(testImageUris);

    if (result.success) {
      console.log('✅ 图片上传成功');
      console.log('上传结果:', result.images);
      
      // 验证返回的图片路径格式
      result.images.forEach((image, index) => {
        console.log(`图片 ${index + 1}:`, {
          id: image.id,
          uri: image.uri,
          isValidPath: image.uri.startsWith('/uploads/posts/')
        });
      });
    } else {
      console.log('❌ 图片上传失败');
    }

    console.log('=== 图片上传功能测试完成 ===');
    return result;

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 验证图片文件格式
 */
export const validateImageFormat = (uri) => {
  const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = uri.toLowerCase().split('.').pop();
  return supportedFormats.includes(`.${extension}`);
};

/**
 * 估算图片文件大小（基于URI，仅供参考）
 */
export const estimateImageSize = (uri) => {
  // 这是一个简化的估算，实际大小需要读取文件
  // 在实际应用中，可以使用FileSystem API获取真实大小
  return {
    estimated: true,
    message: '需要读取文件获取真实大小'
  };
};

// 在开发环境下可以调用此函数进行测试
if (__DEV__) {
  // testImageUpload();
}