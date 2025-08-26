import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { COLORS } from '../theme/colors';
import { useToastContext } from '../contexts/ToastContext';
import ApiService from '../services/api';

const PostReviewScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const { showError, showSuccess } = useToastContext();
  
  // 从路由参数获取帖子内容和完整数据
  const { postContent, postData, postId, isEdit = false } = route.params || {};

  useEffect(() => {
    if (postContent) {
      handleReviewPost();
    }
  }, [postContent]);

  const handleReviewPost = async () => {
    if (!postContent) {
      showError('没有找到需要审核的内容');
      return;
    }

    setLoading(true);
    setReviewResult(null);

    try {
      const result = await ApiService.request('/posts/verifyPosts', {
        method: 'POST',
        body: JSON.stringify({
          content: postContent,
          postId: postId,
        }),
      });
      
      setReviewResult(result);

    } catch (error) {
      console.error('审核失败:', error);
      showError('审核服务暂时不可用，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    handleReviewPost().finally(() => setRefreshing(false));
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleContinueEdit = () => {
    if (isEdit) {
      navigation.navigate('EditPost', { 
        postId: postId,
        reviewFeedback: reviewResult?.reason 
      });
    } else {
      navigation.navigate('Create', { 
        reviewFeedback: reviewResult?.reason 
      });
    }
  };

  const handleConfirmPublish = () => {


    if (isEdit) {
      // 审核通过，返回EditPostScreen并触发保存
      navigation.navigate('EditPost', { 
        postId: postId,
        shouldSave: true 
      });
    } else {
      // 审核通过，返回CreateScreen并触发发布
      navigation.navigate('Create', { 
        shouldPublish: true,
        reviewedContent: postContent,
        reviewedPostData: postData // 传递完整的发布数据
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* 顶部导航 */}
      <View style={{
        backgroundColor: COLORS.surface,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 50
      }}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={{
            fontSize: 16,
            color: COLORS.primary,
            fontWeight: '600',
          }}>
            ← 返回
          </Text>
        </TouchableOpacity>
        
        <Text style={{
          fontSize: 18,
          fontWeight: '700',
          color: COLORS.text,
        }}>
          内容审核
        </Text>
        
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 审核内容预览 */}
        <Card style={{ marginBottom: 20 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.text,
            marginBottom: 12,
          }}>
            审核内容
          </Text>
          <View style={{
            backgroundColor: COLORS.bg,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.borderLight,
          }}>
            <Text style={{
              fontSize: 14,
              lineHeight: 22,
              color: COLORS.text,
            }}>
              {postContent}
            </Text>
          </View>
        </Card>

        {/* 审核状态 */}
        <Card style={{ marginBottom: 20 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: COLORS.text,
            }}>
              审核结果
            </Text>
            {loading && (
              <ActivityIndicator 
                size="small" 
                color={COLORS.primary} 
                style={{ marginLeft: 12 }}
              />
            )}
          </View>

          {loading ? (
            <View style={{
              alignItems: 'center',
              paddingVertical: 40,
            }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={{
                fontSize: 14,
                color: COLORS.textMuted,
                marginTop: 12,
              }}>
                正在进行内容审核...
              </Text>
            </View>
          ) : reviewResult ? (
            <View>
              {/* 审核结果状态 */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: reviewResult.result === 1 ? COLORS.successLight : COLORS.errorLight,
                padding: 16,
                borderRadius: 12,
                marginBottom: 16,
              }}>
                <Text style={{
                  fontSize: 24,
                  marginRight: 12,
                }}>
                  {reviewResult.result === 1 ? '✅' : '❌'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: reviewResult.result === 1 ? COLORS.success : COLORS.error,
                    marginBottom: 4,
                  }}>
                    {reviewResult.result === 1 ? '审核通过' : '审核未通过'}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: reviewResult.result === 1 ? COLORS.success : COLORS.error,
                  }}>
                    {reviewResult.result === 1 
                      ? '内容符合社区规范，可以发布' 
                      : '内容不符合社区规范，请修改后重试'
                    }
                  </Text>
                </View>
              </View>

              {/* 审核未通过的原因 */}
              {reviewResult.result === 0 && reviewResult.reason && (
                <View style={{
                  backgroundColor: COLORS.warningLight,
                  padding: 16,
                  borderRadius: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: COLORS.warning,
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: COLORS.warning,
                    marginBottom: 8,
                  }}>
                    未通过原因
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    lineHeight: 20,
                    color: COLORS.text,
                  }}>
                    {reviewResult.reason}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={{
              alignItems: 'center',
              paddingVertical: 40,
            }}>
              <Text style={{
                fontSize: 48,
                marginBottom: 12,
              }}>
                🔍
              </Text>
              <Text style={{
                fontSize: 14,
                color: COLORS.textMuted,
                textAlign: 'center',
              }}>
                点击重试开始审核
              </Text>
            </View>
          )}
        </Card>

        {/* 操作按钮 */}
        {reviewResult && (
          <View style={{ gap: 12 }}>
            {reviewResult.result === 1 ? (
              <TouchableOpacity
                onPress={handleConfirmPublish}
                style={{
                  backgroundColor: COLORS.success,
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{
                  color: COLORS.surface,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  确认发布
                </Text>
              </TouchableOpacity>
            ) : (
              <Button
                title="返回修改"
                onPress={handleContinueEdit}
                variant="primary"
              />
            )}
            
            <Button
              title="取消"
              onPress={handleGoBack}
              variant="outline"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PostReviewScreen;