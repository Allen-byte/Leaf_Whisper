export const gradients = [
  // 高级紫色系
  ['#667eea', '#764ba2', '#f093fb'],
  ['#a8edea', '#fed6e3', '#d299c2'],
  
  // 现代蓝色系
  ['#4facfe', '#00f2fe', '#43e97b'],
  ['#84fab0', '#8fd3f4', '#a8e6cf'],
  
  // 温暖橙色系
  ['#f7971e', '#ffd200', '#ff9f43'],
  ['#ff8a80', '#ff80ab', '#ffc1cc'],
  
  // 优雅粉色系
  ['#ff7eb3', '#ff519e', '#ff79c6'],
  ['#fa709a', '#fee140', '#ffd60a'],
  
  // 清新绿色系
  ['#43e97b', '#38f9d7', '#7de3ca'],
  ['#56ab2f', '#a8e6cf', '#88d8a3'],
  
  // 深邃夜色系
  ['#2c3e50', '#4a6741', '#34495e'],
  ['#232526', '#414345', '#2c3e50'],
];

// 扩展渐变色方案
export const enhancedGradients = {
  // 时间段渐变
  morning: [['#FFE082', '#FFAB40', '#FF8A65'], ['#81C784', '#66BB6A', '#4CAF50']],
  afternoon: [['#64B5F6', '#42A5F5', '#2196F3'], ['#FFB74D', '#FFA726', '#FF9800']],
  evening: [['#BA68C8', '#AB47BC', '#9C27B0'], ['#F06292', '#EC407A', '#E91E63']],
  night: [['#5C6BC0', '#3F51B5', '#303F9F'], ['#78909C', '#607D8B', '#455A64']],
  
  // 心情主题渐变
  energetic: [['#FF6B6B', '#4ECDC4', '#45B7D1'], ['#96CEB4', '#FFEAA7', '#DDA0DD']],
  calm: [['#A8E6CF', '#88D8A3', '#68C3A3'], ['#B8E6B8', '#A8D8EA', '#AA96DA']],
  creative: [['#FFD93D', '#6BCF7F', '#4D96FF'], ['#FF8A80', '#FFD54F', '#81C784']],
  mysterious: [['#667eea', '#764ba2', '#f093fb'], ['#232526', '#414345', '#2c3e50']]
};

// 智能色彩选择
export const getSmartGradient = (postId, hasImage, mood, timeOfDay, tags) => {
  const hour = new Date().getHours();
  let timeCategory = 'morning';
  
  if (hour >= 6 && hour < 12) timeCategory = 'morning';
  else if (hour >= 12 && hour < 18) timeCategory = 'afternoon';
  else if (hour >= 18 && hour < 22) timeCategory = 'evening';
  else timeCategory = 'night';
  
  // 根据标签选择主题
  if (tags?.includes('创意') || tags?.includes('艺术')) {
    return enhancedGradients.creative[postId % enhancedGradients.creative.length];
  }
  
  // 根据心情选择
  if (mood && enhancedGradients[mood]) {
    return enhancedGradients[mood][postId % enhancedGradients[mood].length];
  }
  
  // 根据时间选择
  return enhancedGradients[timeCategory][postId % enhancedGradients[timeCategory].length];
};