import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { Card } from './Card';
import { COLORS } from '../../theme/colors';

export const Dropdown = ({ 
  options = [], 
  value, 
  onSelect, 
  placeholder = "请选择",
  style 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (option) => {
    onSelect(option.value);
    setIsVisible(false);
  };

  const renderOption = ({ item }) => (
    <Pressable
      onPress={() => handleSelect(item)}
      style={({ pressed }) => ({
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: pressed ? COLORS.primaryLight : 'transparent',
        borderRadius: 8,
        marginHorizontal: 4,
        marginVertical: 2,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {item.emoji && (
          <Text style={{ fontSize: 16, marginRight: 8 }}>{item.emoji}</Text>
        )}
        <Text style={{
          fontSize: 16,
          color: COLORS.text,
          fontWeight: value === item.value ? '600' : '400'
        }}>
          {item.label}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={style}>
      <Pressable onPress={() => setIsVisible(true)}>
        <Card variant="flat" padding={12}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {selectedOption ? (
                <>
                  {selectedOption.emoji && (
                    <Text style={{ fontSize: 16, marginRight: 8 }}>
                      {selectedOption.emoji}
                    </Text>
                  )}
                  <Text style={{ 
                    fontSize: 16, 
                    color: COLORS.text,
                    fontWeight: '500'
                  }}>
                    {selectedOption.label}
                  </Text>
                </>
              ) : (
                <Text style={{ 
                  fontSize: 16, 
                  color: COLORS.textMuted 
                }}>
                  {placeholder}
                </Text>
              )}
            </View>
            <Text style={{ 
              fontSize: 16, 
              color: COLORS.textMuted,
              marginLeft: 8
            }}>
              ▼
            </Text>
          </View>
        </Card>
      </Pressable>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable 
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20
          }}
          onPress={() => setIsVisible(false)}
        >
          <Pressable 
            style={{ width: '100%', maxWidth: 300 }}
            onPress={(e) => e.stopPropagation()}
          >
            <Card style={{ maxHeight: 400 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: COLORS.text,
                marginBottom: 12,
                textAlign: 'center'
              }}>
                你现在感觉如何？
              </Text>
              
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={renderOption}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 300 }}
              />
              
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderLight }}>
                <Pressable
                  onPress={() => setIsVisible(false)}
                  style={({ pressed }) => ({
                    // paddingVertical: 12,
                    alignItems: 'center',
                    backgroundColor: pressed ? COLORS.borderLight : 'transparent',
                    borderRadius: 8,
                  })}
                >
                  <Text style={{
                    fontSize: 16,
                    color: COLORS.textMuted,
                    fontWeight: '500',
                    lineHeight: 16
                  }}>
                    取消
                  </Text>
                </Pressable>
              </View>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};