const { createPublicClient, http } = require('viem');

const STAKEHUB_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "operatorAddress", "type": "address"}
    ],
    "name": "getValidatorCreditContract",
    "outputs": [
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const STAKE_CREDIT_ABI = [
  {
    "inputs": [],
    "name": "totalPooledBNB",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const client = createPublicClient({
  transport: http('http://103.161.174.29:8545')
});

async function testCreditContract() {
  try {
    console.log('Testing getValidatorCreditContract...');
    const creditAddress = await client.readContract({
      address: '0x0000000000000000000000000000000000002002',
      abi: STAKEHUB_ABI,
      functionName: 'getValidatorCreditContract',
      args: ['0x38D7c621FdB099A0c5b91adBd6B687e5DC6a2Fd5']
    });
    console.log('Credit contract address:', creditAddress);
    
    if (creditAddress) {
      console.log('Testing totalPooledBNB on credit contract...');
      const totalPooled = await client.readContract({
        address: creditAddress,
        abi: STAKE_CREDIT_ABI,
        functionName: 'totalPooledBNB',
        args: []
      });
      console.log('Total pooled BNB:', totalPooled.toString());
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testCreditContract();