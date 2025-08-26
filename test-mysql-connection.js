const getRandomGradientColors = () => {
    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const color1 = getRandomColor();
    const color2 = getRandomColor();
    return [color1, color2];
};

const getGradientColors = (postId) => {
    // 如果需要固定帖子的渐变色，可以使用以下代码
    // const seed = postId;
    // Math.seedrandom(seed);
    return getRandomGradientColors();
};

console.log(getGradientColors(3),
getGradientColors(7));