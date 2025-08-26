import UserService from '../services/userService';

/**
 * 测试用户信息持久化存储功能
 */
export const testUserPersistence = async () => {
    console.log('=== 开始测试用户持久化存储 ===');

    try {
        // 1. 测试保存用户信息
        const testUser = {
            id: 1,
            username: 'testuser',
            name: '测试用户',
            bio: '这是一个测试用户',
            avatar: 'assets/images/Guinea_pig.png',
            createdAt: new Date().toISOString()
        };

        console.log('1. 保存测试用户信息...');
        await UserService.saveUserInfo(testUser);
        console.log('✅ 用户信息保存成功');

        // 2. 测试获取用户信息
        console.log('2. 获取用户信息...');
        const savedUser = await UserService.getCurrentUser();
        console.log('✅ 获取用户信息成功:', savedUser);

        // 3. 验证数据完整性
        console.log('3. 验证数据完整性...');
        if (savedUser && savedUser.id === testUser.id && savedUser.name === testUser.name) {
            console.log('✅ 数据完整性验证通过');
        } else {
            console.log('❌ 数据完整性验证失败');
        }

        // 4. 测试登录状态检查
        console.log('4. 测试登录状态检查...');
        const isLoggedIn = await UserService.isLoggedIn();
        console.log('登录状态:', isLoggedIn);

        // 5. 测试清除用户信息
        console.log('5. 清除用户信息...');
        await UserService.clearUserInfo();
        console.log('✅ 用户信息清除成功');

        // 6. 验证清除结果
        console.log('6. 验证清除结果...');
        const clearedUser = await UserService.getCurrentUser();
        if (clearedUser === null) {
            console.log('✅ 用户信息清除验证通过');
        } else {
            console.log('❌ 用户信息清除验证失败');
        }

        console.log('=== 用户持久化存储测试完成 ===');
        return true;

    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error);
        return false;
    }
};

// 在开发环境下可以调用此函数进行测试
if (__DEV__) {
    testUserPersistence();
}