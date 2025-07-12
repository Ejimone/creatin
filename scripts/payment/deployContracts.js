const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Configuration
const HARDHAT_NETWORK_URL = 'http://127.0.0.1:8545';
const web3 = new Web3(HARDHAT_NETWORK_URL);

// Load contract ABI and bytecode
function loadContract(contractName) {
    const artifactPath = path.join(__dirname, '../../artifacts/contracts', `${contractName}.sol`, `${contractName}.json`);
    
    if (!fs.existsSync(artifactPath)) {
        throw new Error(`Contract artifact not found: ${artifactPath}`);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return {
        abi: artifact.abi,
        bytecode: artifact.bytecode
    };
}

class ContractDeployer {
    constructor() {
        this.web3 = web3;
        this.accounts = [];
        this.deployedContracts = {};
    }

    async initialize() {
        try {
            // Get accounts from Hardhat
            this.accounts = await this.web3.eth.getAccounts();
            console.log(`Available accounts: ${this.accounts.length}`);
            
            // Display account balances
            for (let i = 0; i < Math.min(this.accounts.length, 5); i++) {
                const balance = await this.web3.eth.getBalance(this.accounts[i]);
                console.log(`Account ${i}: ${this.accounts[i]} - ${this.web3.utils.fromWei(balance, 'ether')} ETH`);
            }
            
            console.log('Contract Deployer initialized successfully');
        } catch (error) {
            console.error('Error initializing ContractDeployer:', error);
            throw error;
        }
    }

    async deployContract(contractName, constructorArgs = [], deployerAccountIndex = 0) {
        try {
            console.log(`\n=== Deploying ${contractName} Contract ===`);
            
            const { abi, bytecode } = loadContract(contractName);
            const deployerAccount = this.accounts[deployerAccountIndex];
            
            console.log(`Deployer: ${deployerAccount}`);
            console.log(`Constructor args:`, constructorArgs);
            
            const contract = new this.web3.eth.Contract(abi);
            const deployTx = contract.deploy({
                data: bytecode,
                arguments: constructorArgs
            });

            // Estimate gas
            const gas = await deployTx.estimateGas({ from: deployerAccount });
            console.log(`Estimated gas: ${gas}`);

            // Deploy contract
            const gasPrice = await this.web3.eth.getGasPrice();
            const deployedContract = await deployTx.send({
                from: deployerAccount,
                gas: Number(gas) + Math.floor(Number(gas) * 0.2), // Add 20% buffer
                gasPrice: Number(gasPrice)
            });

            console.log(`${contractName} deployed at: ${deployedContract.options.address}`);
            
            // Store deployed contract
            this.deployedContracts[contractName] = {
                contract: deployedContract,
                address: deployedContract.options.address,
                deployer: deployerAccount
            };
            
            return deployedContract;
        } catch (error) {
            console.error(`Error deploying ${contractName}:`, error);
            throw error;
        }
    }

    async deployAllContracts() {
        try {
            const [owner, teacher, invigilator, seller, buyer1, buyer2] = this.accounts;
            
            // Deploy TestExam contract
            await this.deployContract('TestExam', [teacher, invigilator], 0);
            
            // Deploy HostelSnacks contract
            await this.deployContract('HostelSnacks', [], 0);
            
            // Deploy CollegeBreakfast contract  
            await this.deployContract('CollegeBreakfast', [owner], 0);
            
            console.log('\n=== All Contracts Deployed Successfully ===');
            Object.entries(this.deployedContracts).forEach(([name, info]) => {
                console.log(`${name}: ${info.address}`);
            });
            
            return this.deployedContracts;
        } catch (error) {
            console.error('Error deploying all contracts:', error);
            throw error;
        }
    }

    getContract(contractName) {
        if (!this.deployedContracts[contractName]) {
            throw new Error(`Contract ${contractName} not deployed`);
        }
        return this.deployedContracts[contractName].contract;
    }

    getContractAddress(contractName) {
        if (!this.deployedContracts[contractName]) {
            throw new Error(`Contract ${contractName} not deployed`);
        }
        return this.deployedContracts[contractName].address;
    }

    saveDeploymentInfo(filename = 'deployment.json') {
        const deploymentInfo = {};
        Object.entries(this.deployedContracts).forEach(([name, info]) => {
            deploymentInfo[name] = {
                address: info.address,
                deployer: info.deployer
            };
        });
        
        const filePath = path.join(__dirname, filename);
        fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`Deployment info saved to: ${filePath}`);
    }

    loadDeploymentInfo(filename = 'deployment.json') {
        const filePath = path.join(__dirname, filename);
        if (fs.existsSync(filePath)) {
            const deploymentInfo = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log('Loaded deployment info:', deploymentInfo);
            return deploymentInfo;
        }
        return null;
    }
}

// Demo function to deploy all contracts
async function deployAllContractsDemo() {
    const deployer = new ContractDeployer();
    
    try {
        await deployer.initialize();
        await deployer.deployAllContracts();
        deployer.saveDeploymentInfo();
        
        console.log('\n=== Deployment Demo Completed Successfully ===');
        
    } catch (error) {
        console.error('Deployment demo failed:', error);
        throw error;
    }
}

module.exports = {
    ContractDeployer,
    deployAllContractsDemo,
    loadContract
};

// Run demo if script is executed directly
if (require.main === module) {
    deployAllContractsDemo()
        .then(() => {
            console.log('All contracts deployed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Deployment failed:', error);
            process.exit(1);
        });
}
