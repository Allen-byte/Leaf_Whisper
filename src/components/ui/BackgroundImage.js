import React from 'react';
import { ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SERVER_BASE_URL } from '../../config/env';

const getImageSource = (imagePath) => {
  if (!imagePath) return null;
  
  // 处理本地资源路径
  if (imagePath === 'assets/images/default.png') {
    return require('../../../assets/images/default.png');
  }

  //处理服务器返回的路径
  if (imagePath.startsWith('/uploads/')) {
    return { uri: `${SERVER_BASE_URL}${imagePath}` };
  }

  
  if (imagePath.startsWith('assets/')) {
    // 根据具体路径返回对应的require
    const fileName = imagePath.split('/').pop();
    switch (fileName) {
      case 'default.png':
        return require('../../../assets/images/default.png');
      default:
        return null;
    }
  }
  
  // 处理网络URL或本地文件URI
  if (imagePath.startsWith('http') || imagePath.startsWith('file://')) {
    return { uri: imagePath };
  }
  
  // 默认作为URI处理
  return { uri: imagePath };
};

export const BackgroundImage = ({ 
  imagePath, 
  style, 
  imageStyle, 
  children,
  defaultGradient = ['#667eea', '#764ba2']
}) => {
  const source = getImageSource(imagePath);
  
  return (
    <ImageBackground
      source={source}
      style={style}
      imageStyle={imageStyle}
    >
      {/* 当没有有效背景图时显示默认渐变 */}
      {!source && (
        <LinearGradient
          colors={defaultGradient}
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
      )}
      {children}
    </ImageBackground>
  );
};