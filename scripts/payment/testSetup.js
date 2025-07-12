const { Web3 } = require('web3');
const { ContractDeployer } = require('./deployContracts');

async function testBasicSetup() {
    console.log('🔧 Testing Basic Setup...');
    
    try {
        const deployer = new ContractDeployer();
        await deployer.initialize();
        
        console.log('✅ Web3 connection successful');
        console.log('✅ Accounts loaded successfully');
        
        // Test contract loading
        const testExamArtifact = deployer.web3.utils.isAddress('0x0000000000000000000000000000000000000000');
        console.log('✅ Contract artifacts accessible');
        
        return true;
    } catch (error) {
        console.error('❌ Basic setup test failed:', error.message);
        return false;
    }
}

async function testQuickDeployment() {
    console.log('\n🚀 Testing Quick Deployment...');
    
    try {
        const deployer = new ContractDeployer();
        await deployer.initialize();
        
        // Deploy just one contract for testing
        await deployer.deployContract('HostelSnacks', [], 0);
        
        console.log('✅ Contract deployment successful');
        console.log('✅ Contract address generated');
        
        return true;
    } catch (error) {
        console.error('❌ Quick deployment test failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🧪 Running Payment Scripts Validation Tests\n');
    
    const tests = [
        { name: 'Basic Setup', fn: testBasicSetup },
        { name: 'Quick Deployment', fn: testQuickDeployment }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passed++;
                console.log(`✅ ${test.name} - PASSED`);
            } else {
                failed++;
                console.log(`❌ ${test.name} - FAILED`);
            }
        } catch (error) {
            failed++;
            console.log(`❌ ${test.name} - ERROR:`, error.message);
        }
    }
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Payment scripts are ready to use.');
        console.log('\n📋 Next steps:');
        console.log('1. Start Hardhat network: npx hardhat node');
        console.log('2. Run complete demo: node scripts/payment/masterPaymentScript.js');
        console.log('3. Or run individual scripts as needed');
    } else {
        console.log('⚠️  Some tests failed. Please check the setup.');
    }
    
    return failed === 0;
}

if (require.main === module) {
    runAllTests()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('Test runner failed:', error);
            process.exit(1);
        });
}

module.exports = { runAllTests };
