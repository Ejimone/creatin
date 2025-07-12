const { ExamPaymentManager } = require('./examPaymentScript');
const { HostelSnacksPaymentManager } = require('./hostelSnacksPaymentScript');
const { ContractDeployer } = require('./deployContracts');

/**
 * Master Payment Script
 * Handles all payment-related operations for the smart contracts
 */
class MasterPaymentManager {
    constructor() {
        this.deployer = new ContractDeployer();
        this.examManager = new ExamPaymentManager();
        this.snacksManager = new HostelSnacksPaymentManager();
        this.accounts = [];
        this.deployedContracts = {};
    }

    async initialize() {
        try {
            console.log('=== Initializing Master Payment Manager ===');
            
            await this.deployer.initialize();
            this.accounts = this.deployer.accounts;
            
            console.log('Master Payment Manager initialized successfully');
        } catch (error) {
            console.error('Error initializing Master Payment Manager:', error);
            throw error;
        }
    }

    async deployAllContracts() {
        try {
            console.log('\n=== Deploying All Contracts ===');
            
            this.deployedContracts = await this.deployer.deployAllContracts();
            
            // Set contract instances for managers
            this.examManager.contract = this.deployer.getContract('TestExam');
            this.snacksManager.contract = this.deployer.getContract('HostelSnacks');
            
            console.log('All contracts deployed and managers configured');
            return this.deployedContracts;
        } catch (error) {
            console.error('Error deploying contracts:', error);
            throw error;
        }
    }

    async runExamPaymentWorkflow() {
        try {
            console.log('\n=== Running Exam Payment Workflow ===');
            
            const [owner, teacher, invigilator, student] = this.accounts;
            
            // Setup exam
            const currentTime = Math.floor(Date.now() / 1000);
            const examDetails = {
                name: "Advanced Solidity Programming",
                description: "Smart contract development assessment",
                fee: 0.005, // 0.005 ETH
                duration: 7200, // 2 hours
                startTime: currentTime + 300, // Start in 5 minutes
                endTime: currentTime + 7500 // End in 2 hours 5 minutes
            };
            
            // Register student and setup exam
            await this.examManager.registerStudent(student, teacher);
            await this.examManager.setupExam(examDetails, teacher);
            await this.examManager.openExam(0.005, 7200, examDetails.startTime, examDetails.endTime, teacher);
            
            // Student pays for exam
            console.log('Processing exam payment...');
            await this.examManager.payForExam(student, 0.005);
            
            // Get final exam details
            const finalDetails = await this.examManager.getExamDetails();
            console.log('Exam setup completed:', {
                name: finalDetails.examName,
                fee: finalDetails.examFee + ' ETH',
                status: finalDetails.isOpen ? 'Open' : 'Closed'
            });
            
            return finalDetails;
        } catch (error) {
            console.error('Error in exam payment workflow:', error);
            throw error;
        }
    }

    async runSnacksPaymentWorkflow() {
        try {
            console.log('\n=== Running Snacks Payment Workflow ===');
            
            const [owner, teacher, invigilator, seller, buyer1, buyer2] = this.accounts;
            
            // Register users
            await this.snacksManager.registerSeller(seller);
            await this.snacksManager.registerBuyer(buyer1, "Alice");
            await this.snacksManager.registerBuyer(buyer2, "Bob");
            
            // Seller adds snacks
            const snacks = [
                { name: "Premium Chips", price: 0.002, quantity: 100, id: "premium_chips_001" },
                { name: "Chocolate Cookies", price: 0.003, quantity: 50, id: "choco_cookies_001" },
                { name: "Energy Drink", price: 0.005, quantity: 75, id: "energy_drink_001" },
                { name: "Instant Noodles", price: 0.004, quantity: 60, id: "instant_noodles_001" }
            ];
            
            console.log('Adding snacks to inventory...');
            for (const snack of snacks) {
                await this.snacksManager.addSnack(seller, snack);
            }
            
            // Simulate multiple purchases
            console.log('Processing snack purchases...');
            const purchases = [
                { buyer: buyer1, snackId: "premium_chips_001", quantity: 3 },
                { buyer: buyer2, snackId: "choco_cookies_001", quantity: 2 },
                { buyer: buyer1, snackId: "energy_drink_001", quantity: 1 },
                { buyer: buyer2, snackId: "instant_noodles_001", quantity: 2 },
                { buyer: buyer1, snackId: "choco_cookies_001", quantity: 1 }
            ];
            
            for (const purchase of purchases) {
                await this.snacksManager.buySnack(purchase.buyer, purchase.snackId, purchase.quantity);
            }
            
            // Get final statistics
            const buyer1Details = await this.snacksManager.getBuyerDetails(buyer1);
            const buyer2Details = await this.snacksManager.getBuyerDetails(buyer2);
            const sellerDetails = await this.snacksManager.getSellerDetails(seller);
            
            console.log('Snacks workflow completed:');
            console.log('- Alice total spent:', buyer1Details.amountSpent, 'ETH');
            console.log('- Bob total spent:', buyer2Details.amountSpent, 'ETH');
            console.log('- Seller total earnings:', sellerDetails.totalEarnings, 'ETH');
            
            return {
                buyer1: buyer1Details,
                buyer2: buyer2Details,
                seller: sellerDetails
            };
        } catch (error) {
            console.error('Error in snacks payment workflow:', error);
            throw error;
        }
    }

    async runRefundDemo() {
        try {
            console.log('\n=== Running Refund Demo ===');
            
            const [owner, , , , buyer1] = this.accounts;
            
            // Process a refund for buyer1
            const refundAmount = 0.002; // 0.002 ETH
            
            console.log(`Processing refund of ${refundAmount} ETH for buyer1...`);
            await this.snacksManager.processRefund(owner, buyer1, refundAmount);
            
            // Check updated buyer details
            const updatedBuyerDetails = await this.snacksManager.getBuyerDetails(buyer1);
            console.log('Buyer1 updated details after refund:', updatedBuyerDetails);
            
            return updatedBuyerDetails;
        } catch (error) {
            console.error('Error in refund demo:', error);
            throw error;
        }
    }

    async generatePaymentReport() {
        try {
            console.log('\n=== Generating Payment Report ===');
            
            const [owner, teacher, invigilator, seller, buyer1, buyer2] = this.accounts;
            
            // Get account balances
            const balances = {};
            const roles = ['Owner', 'Teacher', 'Invigilator', 'Seller', 'Buyer1', 'Buyer2'];
            
            for (let i = 0; i < 6; i++) {
                const balance = await this.deployer.web3.eth.getBalance(this.accounts[i]);
                balances[roles[i]] = this.deployer.web3.utils.fromWei(balance, 'ether');
            }
            
            console.log('Final Account Balances:');
            Object.entries(balances).forEach(([role, balance]) => {
                console.log(`${role}: ${balance} ETH`);
            });
            
            // Get contract details
            try {
                const examDetails = await this.examManager.getExamDetails();
                console.log('\nExam Contract Status:');
                console.log(`- Name: ${examDetails.examName}`);
                console.log(`- Fee: ${examDetails.examFee} ETH`);
                console.log(`- Status: ${examDetails.isOpen ? 'Open' : (examDetails.isFinished ? 'Finished' : 'Closed')}`);
            } catch (error) {
                console.log('Exam details not available');
            }
            
            try {
                const sellerDetails = await this.snacksManager.getSellerDetails(seller);
                console.log('\nSnacks Contract Status:');
                console.log(`- Total snacks sold: ${sellerDetails.totalSnacksSold}`);
                console.log(`- Total earnings: ${sellerDetails.totalEarnings} ETH`);
            } catch (error) {
                console.log('Snacks details not available');
            }
            
            return { balances };
        } catch (error) {
            console.error('Error generating payment report:', error);
            throw error;
        }
    }

    async runCompleteDemo() {
        try {
            console.log('🚀 Starting Complete Payment Demo 🚀');
            
            await this.initialize();
            await this.deployAllContracts();
            
            // Save deployment info
            this.deployer.saveDeploymentInfo('latest-deployment.json');
            
            // Run workflows
            await this.runExamPaymentWorkflow();
            await this.runSnacksPaymentWorkflow();
            await this.runRefundDemo();
            
            // Generate final report
            await this.generatePaymentReport();
            
            console.log('\n✅ Complete Payment Demo Finished Successfully! ✅');
            
        } catch (error) {
            console.error('❌ Complete demo failed:', error);
            throw error;
        }
    }
}

// Utility functions for individual operations
async function quickExamPayment(examFee = 0.01) {
    const manager = new MasterPaymentManager();
    await manager.initialize();
    await manager.deployAllContracts();
    
    const [, teacher, invigilator, student] = manager.accounts;
    const currentTime = Math.floor(Date.now() / 1000);
    
    await manager.examManager.registerStudent(student, teacher);
    await manager.examManager.openExam(examFee, 3600, currentTime + 100, currentTime + 3700, teacher);
    await manager.examManager.payForExam(student, examFee);
    
    console.log(`✅ Quick exam payment of ${examFee} ETH completed!`);
}

async function quickSnackPurchase(snackPrice = 0.001, quantity = 1) {
    const manager = new MasterPaymentManager();
    await manager.initialize();
    await manager.deployAllContracts();
    
    const [, , , seller, buyer] = manager.accounts;
    
    await manager.snacksManager.registerSeller(seller);
    await manager.snacksManager.registerBuyer(buyer, "QuickBuyer");
    await manager.snacksManager.addSnack(seller, {
        name: "Quick Snack",
        price: snackPrice,
        quantity: 10,
        id: "quick_snack_001"
    });
    await manager.snacksManager.buySnack(buyer, "quick_snack_001", quantity);
    
    console.log(`✅ Quick snack purchase of ${quantity} items at ${snackPrice} ETH each completed!`);
}

module.exports = {
    MasterPaymentManager,
    quickExamPayment,
    quickSnackPurchase
};

// Run complete demo if script is executed directly
if (require.main === module) {
    const manager = new MasterPaymentManager();
    manager.runCompleteDemo()
        .then(() => {
            console.log('🎉 All payment operations completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Payment operations failed:', error);
            process.exit(1);
        });
}
