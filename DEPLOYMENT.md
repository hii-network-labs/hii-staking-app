# Deployment Guide - HII Staking dApp

## Vercel Deployment

### Prerequisites
1. GitHub account
2. Vercel account (sign up at [vercel.com](https://vercel.com))
3. WalletConnect Project ID (get from [cloud.walletconnect.com](https://cloud.walletconnect.com))

### Step 1: Prepare Repository
1. Push your code to GitHub repository
2. Ensure all files are committed and pushed

### Step 2: Environment Variables Setup
Before deploying, you need to set up the following environment variables in Vercel:

#### Required Environment Variables:
```
NEXT_PUBLIC_CHAIN_ID=15984
NEXT_PUBLIC_CHAIN_NAME="Hii Network devnet"
NEXT_PUBLIC_RPC_URL=http://103.161.174.29:8545
NEXT_PUBLIC_EXPLORER_URL=http://103.161.174.30:8067
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=HII
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=HII
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18
NEXT_PUBLIC_STAKEHUB_ADDRESS=0x0000000000000000000000000000000000002002
NEXT_PUBLIC_OPERATOR_ADDRESS=0x38D7c621FdB099A0c5b91adBd6B687e5DC6a2Fd5
NEXT_PUBLIC_EXTERNAL_API_BASE=http://103.161.174.30:8067/api/v2
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
```

#### Optional Environment Variables:
```
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### Step 3: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (if the project is in root)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install --legacy-peer-deps`

5. Add Environment Variables:
   - Go to "Environment Variables" section
   - Add all the variables listed above
   - Make sure to replace `your_actual_project_id_here` with your real WalletConnect Project ID

6. Click "Deploy"

#### Option B: Deploy via Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. In your project directory: `vercel`
4. Follow the prompts
5. Set environment variables: `vercel env add`

### Step 4: Post-Deployment Configuration

#### Update WalletConnect Settings
1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Add your Vercel domain to the allowed domains list
3. Update the project settings if needed

#### Test Your Deployment
1. Visit your deployed URL
2. Test wallet connection
3. Test staking/unstaking functionality
4. Verify all environment variables are working

### Step 5: Custom Domain (Optional)
1. In Vercel dashboard, go to your project
2. Go to "Settings" > "Domains"
3. Add your custom domain
4. Configure DNS settings as instructed

## Important Notes

### Security Considerations
- Never commit `.env.local` to version control
- Use `.env.example` as a template
- Keep your WalletConnect Project ID secure
- Regularly rotate API keys

### Performance Optimization
- The app is already optimized for production
- Vercel automatically handles caching and CDN
- Consider enabling Vercel Analytics for monitoring

### Troubleshooting

#### Common Issues:
1. **Build Fails**: Check if all dependencies are properly installed
   - Solution: Use `npm install --legacy-peer-deps` in build settings

2. **Environment Variables Not Working**: 
   - Ensure all `NEXT_PUBLIC_` prefixed variables are set
   - Redeploy after adding new environment variables

3. **Wallet Connection Issues**:
   - Verify WalletConnect Project ID is correct
   - Check if domain is added to WalletConnect settings

4. **Network Connection Issues**:
   - Verify RPC URLs are accessible
   - Check if API endpoints are working

### Support
For deployment issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- Project GitHub issues