const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// Configuration
const HARDHAT_NETWORK_URL = 'http://127.0.0.1:8545';
const web3 = new Web3(HARDHAT_NETWORK_URL);

// Load contract ABI and bytecode
function loadContract(contractName) {
    const artifactPath = path.join(__dirname, '../../artifacts/contracts', `${contractName}.sol`, `${contractName}.json`);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    return {
        abi: artifact.abi,
        bytecode: artifact.bytecode
    };
}

class ExamPaymentManager {
    constructor() {
        this.web3 = web3;
        this.contract = null;
        this.accounts = [];
    }

    async initialize() {
        try {
            // Get accounts from Hardhat
            this.accounts = await this.web3.eth.getAccounts();
            console.log('Available accounts:', this.accounts.length);
            
            // Load contract
            const { abi, bytecode } = loadContract('TestExam');
            this.contractFactory = new this.web3.eth.Contract(abi);
            this.contractFactory.options.data = bytecode;
            
            console.log('Exam Payment Manager initialized successfully');
        } catch (error) {
            console.error('Error initializing ExamPaymentManager:', error);
            throw error;
        }
    }

    async deployExamContract(teacherAddress, invigilatorAddress, deployerAccount) {
        try {
            console.log('Deploying Exam contract...');
            
            const deployTx = this.contractFactory.deploy({
                arguments: [teacherAddress, invigilatorAddress]
            });

            const gas = await deployTx.estimateGas({ from: deployerAccount });
            console.log('Estimated gas:', gas);

            const gasPrice = await this.web3.eth.getGasPrice();
            const contract = await deployTx.send({
                from: deployerAccount,
                gas: Number(gas),
                gasPrice: Number(gasPrice)
            });

            this.contract = contract;
            console.log('Exam contract deployed at:', contract.options.address);
            return contract.options.address;
        } catch (error) {
            console.error('Error deploying contract:', error);
            throw error;
        }
    }

    async setupExam(examDetails, teacherAccount) {
        try {
            if (!this.contract) {
                throw new Error('Contract not deployed');
            }

            console.log('Setting up exam details...');
            
            const tx = await this.contract.methods.setExamDetails(
                examDetails.name,
                examDetails.description,
                this.web3.utils.toWei(examDetails.fee.toString(), 'ether'),
                examDetails.duration,
                examDetails.startTime,
                examDetails.endTime
            ).send({
                from: teacherAccount,
                gas: 500000
            });

            console.log('Exam details set. Transaction hash:', tx.transactionHash);
            return tx.transactionHash;
        } catch (error) {
            console.error('Error setting exam details:', error);
            throw error;
        }
    }

    async registerStudent(studentAddress, teacherAccount) {
        try {
            console.log('Registering student:', studentAddress);
            
            const tx = await this.contract.methods.registerStudentPublic(studentAddress).send({
                from: teacherAccount,
                gas: 200000
            });

            console.log('Student registered. Transaction hash:', tx.transactionHash);
            return tx.transactionHash;
        } catch (error) {
            console.error('Error registering student:', error);
            throw error;
        }
    }

    async openExam(examFee, duration, startTime, endTime, teacherAccount) {
        try {
            console.log('Opening exam...');
            
            const tx = await this.contract.methods.openExam(
                this.web3.utils.toWei(examFee.toString(), 'ether'),
                duration,
                startTime,
                endTime
            ).send({
                from: teacherAccount,
                gas: 300000
            });

            console.log('Exam opened. Transaction hash:', tx.transactionHash);
            return tx.transactionHash;
        } catch (error) {
            console.error('Error opening exam:', error);
            throw error;
        }
    }

    async payForExam(studentAccount, examFee) {
        try {
            console.log(`Student ${studentAccount} paying for exam...`);
            
            const feeInWei = this.web3.utils.toWei(examFee.toString(), 'ether');
            
            // Check student balance
            const balance = await this.web3.eth.getBalance(studentAccount);
            console.log('Student balance:', this.web3.utils.fromWei(balance, 'ether'), 'ETH');
            
            if (BigInt(balance) < BigInt(feeInWei)) {
                throw new Error('Insufficient balance to pay exam fee');
            }

            const tx = await this.contract.methods.payForExam().send({
                from: studentAccount,
                value: feeInWei,
                gas: 200000
            });

            console.log('Exam fee paid successfully. Transaction hash:', tx.transactionHash);
            
            // Get updated balances
            const newBalance = await this.web3.eth.getBalance(studentAccount);
            console.log('Student new balance:', this.web3.utils.fromWei(newBalance, 'ether'), 'ETH');
            
            return tx.transactionHash;
        } catch (error) {
            console.error('Error paying for exam:', error);
            throw error;
        }
    }

    async getExamDetails() {
        try {
            if (!this.contract) {
                throw new Error('Contract not deployed');
            }

            const details = await this.contract.methods.getExamDetails().call();
            return {
                examId: details.examId,
                examName: details.examName,
                examFee: this.web3.utils.fromWei(details.examFee.toString(), 'ether'),
                duration: details.examDuration,
                startTime: details.startTime,
                endTime: details.endTime,
                teacher: details.teacher,
                invigilator: details.invigilator,
                isOpen: details.isExamOpen,
                isFinished: details.isExamFinished
            };
        } catch (error) {
            console.error('Error getting exam details:', error);
            throw error;
        }
    }

    async checkPaymentStatus(studentAccount) {
        try {
            // This would need to be implemented in the contract
            // For now, we'll check transaction history
            console.log('Checking payment status for student:', studentAccount);
            return true; // Placeholder
        } catch (error) {
            console.error('Error checking payment status:', error);
            throw error;
        }
    }
}

// Demo function
async function runExamPaymentDemo() {
    const examManager = new ExamPaymentManager();
    
    try {
        await examManager.initialize();
        
        const [owner, teacher, invigilator, student] = examManager.accounts;
        
        // Deploy contract
        await examManager.deployExamContract(teacher, invigilator, owner);
        
        // Setup exam
        const currentTime = Math.floor(Date.now() / 1000);
        const examDetails = {
            name: "Mathematics 101",
            description: "Basic algebra and calculus",
            fee: 0.01, // 0.01 ETH
            duration: 3600, // 1 hour
            startTime: currentTime + 300, // Start in 5 minutes
            endTime: currentTime + 3900 // End in 65 minutes
        };
        
        await examManager.setupExam(examDetails, teacher);
        await examManager.registerStudent(student, teacher);
        await examManager.openExam(0.01, 3600, examDetails.startTime, examDetails.endTime, teacher);
        
        // Student pays for exam
        await examManager.payForExam(student, 0.01);
        
        // Check exam details
        const details = await examManager.getExamDetails();
        console.log('Final exam details:', details);
        
    } catch (error) {
        console.error('Demo failed:', error);
    }
}

// Export for use in other scripts
module.exports = {
    ExamPaymentManager,
    runExamPaymentDemo
};

// Run demo if script is executed directly
if (require.main === module) {
    runExamPaymentDemo()
        .then(() => {
            console.log('Exam payment demo completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Demo failed:', error);
            process.exit(1);
        });
}
