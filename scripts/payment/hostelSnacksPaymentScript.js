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

class HostelSnacksPaymentManager {
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
            const { abi, bytecode } = loadContract('HostelSnacks');
            this.contractFactory = new this.web3.eth.Contract(abi);
            this.contractFactory.options.data = bytecode;
            
            console.log('HostelSnacks Payment Manager initialized successfully');
        } catch (error) {
            console.error('Error initializing HostelSnacksPaymentManager:', error);
            throw error;
        }
    }

    async deployContract(deployerAccount) {
        try {
            console.log('Deploying HostelSnacks contract...');
            
            const deployTx = this.contractFactory.deploy();
            const gas = await deployTx.estimateGas({ from: deployerAccount });
            console.log('Estimated gas:', gas);

            const gasPrice = await this.web3.eth.getGasPrice();
            const contract = await deployTx.send({
                from: deployerAccount,
                gas: Number(gas),
                gasPrice: Number(gasPrice)
            });

            this.contract = contract;
            console.log('HostelSnacks contract deployed at:', contract.options.address);
            return contract.options.address;
        } catch (error) {
            console.error('Error deploying contract:', error);
            throw error;
        }
    }

    async registerSeller(sellerAccount) {
        try {
            console.log('Registering seller:', sellerAccount);
            
            const tx = await this.contract.methods.registerSeller().send({
                from: sellerAccount,
                gas: 200000
            });

            console.log('Seller registered. Transaction hash:', tx.transactionHash);
            return tx.transactionHash;
        } catch (error) {
            console.error('Error registering seller:', error);
            throw error;
        }
    }

    async registerBuyer(buyerAccount, username) {
        try {
            console.log('Registering buyer:', buyerAccount, 'with username:', username);
            
            const tx = await this.contract.methods.registerBuyer(username).send({
                from: buyerAccount,
                gas: 200000
            });

            console.log('Buyer registered. Transaction hash:', tx.transactionHash);
            return tx.transactionHash;
        } catch (error) {
            console.error('Error registering buyer:', error);
            throw error;
        }
    }

    async addSnack(sellerAccount, snackDetails) {
        try {
            console.log('Adding snack:', snackDetails.name);
            
            const priceInWei = this.web3.utils.toWei(snackDetails.price.toString(), 'ether');
            
            const tx = await this.contract.methods.addSnack(
                snackDetails.name,
                priceInWei,
                snackDetails.quantity,
                snackDetails.id
            ).send({
                from: sellerAccount,
                gas: 300000
            });

            console.log('Snack added. Transaction hash:', tx.transactionHash);
            return tx.transactionHash;
        } catch (error) {
            console.error('Error adding snack:', error);
            throw error;
        }
    }

    async buySnack(buyerAccount, snackId, quantity) {
        try {
            console.log(`Buyer ${buyerAccount} purchasing ${quantity} of snack ${snackId}`);
            
            // Get snack details to calculate payment
            const snack = await this.contract.methods.getSnack(snackId).call();
            const totalPrice = BigInt(snack[1]) * BigInt(quantity); // price * quantity
            
            console.log('Snack details:', {
                name: snack[0],
                price: this.web3.utils.fromWei(snack[1].toString(), 'ether'),
                quantity: snack[2],
                totalPrice: this.web3.utils.fromWei(totalPrice.toString(), 'ether')
            });

            // Check buyer balance
            const balance = await this.web3.eth.getBalance(buyerAccount);
            console.log('Buyer balance:', this.web3.utils.fromWei(balance, 'ether'), 'ETH');
            
            if (BigInt(balance) < totalPrice) {
                throw new Error('Insufficient balance to purchase snack');
            }

            const tx = await this.contract.methods.buySnack(snackId, quantity).send({
                from: buyerAccount,
                value: totalPrice.toString(),
                gas: 500000
            });

            console.log('Snack purchased successfully. Transaction hash:', tx.transactionHash);
            
            // Get updated balances
            const newBalance = await this.web3.eth.getBalance(buyerAccount);
            console.log('Buyer new balance:', this.web3.utils.fromWei(newBalance, 'ether'), 'ETH');
            
            return tx.transactionHash;
        } catch (error) {
            console.error('Error purchasing snack:', error);
            throw error;
        }
    }

    async getSnackDetails(snackId) {
        try {
            const snack = await this.contract.methods.getSnack(snackId).call();
            return {
                name: snack[0],
                price: this.web3.utils.fromWei(snack[1].toString(), 'ether'),
                quantity: snack[2],
                id: snack[3]
            };
        } catch (error) {
            console.error('Error getting snack details:', error);
            throw error;
        }
    }

    async getBuyerDetails(buyerAddress) {
        try {
            const buyer = await this.contract.methods.getBuyer(buyerAddress).call();
            return {
                username: buyer[0],
                amountSpent: this.web3.utils.fromWei(buyer[1].toString(), 'ether'),
                purchasedSnacks: buyer[2],
                snackIds: buyer[3]
            };
        } catch (error) {
            console.error('Error getting buyer details:', error);
            throw error;
        }
    }

    async getSellerDetails(sellerAddress) {
        try {
            const seller = await this.contract.methods.getSeller(sellerAddress).call();
            return {
                username: seller[0],
                earnings: this.web3.utils.fromWei(seller[1].toString(), 'ether'),
                snackIds: seller[2],
                soldSnacks: seller[3],
                totalSnacksSold: seller[4],
                totalEarnings: this.web3.utils.fromWei(seller[5].toString(), 'ether')
            };
        } catch (error) {
            console.error('Error getting seller details:', error);
            throw error;
        }
    }

    async updateSnackPrice(sellerAccount, snackId, newPrice) {
        try {
            console.log(`Updating snack ${snackId} price to ${newPrice} ETH`);
            
            const snack = await this.getSnackDetails(snackId);
            const newPriceInWei = this.web3.utils.toWei(newPrice.toString(), 'ether');
            
            const tx = await this.contract.methods.updateSnack(
                snackId,
                newPriceInWei,
                this.web3.utils.toWei(snack.quantity.toString(), 'wei')
            ).send({
                from: sellerAccount,
                gas: 200000
            });

            console.log('Snack price updated. Transaction hash:', tx.transactionHash);
            return tx.transactionHash;
        } catch (error) {
            console.error('Error updating snack price:', error);
            throw error;
        }
    }

    async deleteSnack(sellerAccount, snackId) {
        try {
            console.log(`Deleting snack ${snackId}`);
            
            const tx = await this.contract.methods.deleteSnack(snackId).send({
                from: sellerAccount,
                gas: 300000
            });

            console.log('Snack deleted. Transaction hash:', tx.transactionHash);
            return tx.transactionHash;
        } catch (error) {
            console.error('Error deleting snack:', error);
            throw error;
        }
    }

    async processRefund(ownerAccount, buyerAddress, refundAmount) {
        try {
            console.log(`Processing refund of ${refundAmount} ETH for buyer ${buyerAddress}`);
            
            const refundInWei = this.web3.utils.toWei(refundAmount.toString(), 'ether');
            
            const tx = await this.contract.methods.refundBuyer(buyerAddress, refundInWei).send({
                from: ownerAccount,
                gas: 200000
            });

            console.log('Refund processed. Transaction hash:', tx.transactionHash);
            return tx.transactionHash;
        } catch (error) {
            console.error('Error processing refund:', error);
            throw error;
        }
    }
}

// Demo function
async function runHostelSnacksPaymentDemo() {
    const snacksManager = new HostelSnacksPaymentManager();
    
    try {
        await snacksManager.initialize();
        
        const [owner, seller, buyer1, buyer2] = snacksManager.accounts;
        
        // Deploy contract
        await snacksManager.deployContract(owner);
        
        // Register users
        await snacksManager.registerSeller(seller);
        await snacksManager.registerBuyer(buyer1, "alice");
        await snacksManager.registerBuyer(buyer2, "bob");
        
        // Seller adds snacks
        const snacks = [
            { name: "Chips", price: 0.001, quantity: 50, id: "chips_001" },
            { name: "Cookies", price: 0.002, quantity: 30, id: "cookies_001" },
            { name: "Soda", price: 0.0015, quantity: 40, id: "soda_001" }
        ];
        
        for (const snack of snacks) {
            await snacksManager.addSnack(seller, snack);
        }
        
        // Buyers purchase snacks
        await snacksManager.buySnack(buyer1, "chips_001", 2);
        await snacksManager.buySnack(buyer2, "cookies_001", 1);
        await snacksManager.buySnack(buyer1, "soda_001", 3);
        
        // Check details
        console.log('\n=== FINAL DETAILS ===');
        
        for (const snack of snacks) {
            try {
                const snackDetails = await snacksManager.getSnackDetails(snack.id);
                console.log(`Snack ${snack.id}:`, snackDetails);
            } catch (error) {
                console.log(`Snack ${snack.id}: Deleted or not found`);
            }
        }
        
        const buyer1Details = await snacksManager.getBuyerDetails(buyer1);
        console.log('Buyer1 details:', buyer1Details);
        
        const buyer2Details = await snacksManager.getBuyerDetails(buyer2);
        console.log('Buyer2 details:', buyer2Details);
        
        const sellerDetails = await snacksManager.getSellerDetails(seller);
        console.log('Seller details:', sellerDetails);
        
        // Demo refund
        await snacksManager.processRefund(owner, buyer1, 0.001);
        
    } catch (error) {
        console.error('Demo failed:', error);
    }
}

// Export for use in other scripts
module.exports = {
    HostelSnacksPaymentManager,
    runHostelSnacksPaymentDemo
};

// Run demo if script is executed directly
if (require.main === module) {
    runHostelSnacksPaymentDemo()
        .then(() => {
            console.log('HostelSnacks payment demo completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Demo failed:', error);
            process.exit(1);
        });
}
