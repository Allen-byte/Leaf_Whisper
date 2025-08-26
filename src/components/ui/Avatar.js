import React from 'react';
import { View, Text, Image } from 'react-native';
import { COLORS } from '../../theme/colors';
import { SERVER_BASE_URL } from '../../config/env';

const DefaultAvatar = require('../../../assets/images/cr_dog.png');


export const Avatar = ({ 
  uri, 
  size = 40, 
  name = '',
  emoji = '',
  style 
}) => {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  // 判断头像来源
  const getImageSource = () => {
    if (uri) {
      // 如果是服务器上传的头像路径（以/uploads开头）
      if (uri.startsWith('/uploads/')) {
        return { uri: `${SERVER_BASE_URL}${uri}` };
      }
      // 如果是本地资源路径
      else if (uri.startsWith('assets/images')) {
        return DefaultAvatar;
      }
      // 如果是完整的本地文件路径（file://开头）
      else if (uri.startsWith('file://')) {
        return { uri };
      }
    }

    return DefaultAvatar;
  };

  return (
    <View style={[avatarStyle, style]}>
      {uri || !name ? (
        <Image 
          source={getImageSource()}
          style={{ 
            width: size, 
            height: size, 
            borderRadius: size / 2 
          }} 
          onError={() => {
            console.log('头像加载失败，使用默认头像');
          }}
        />
      ) : (
        <Text style={{ 
          fontSize: size * 0.4, 
          fontWeight: '600',
          color: COLORS.primary 
        }}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};