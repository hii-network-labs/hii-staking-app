# HII Staking dApp

Một ứng dụng staking nhẹ cho Hii Network (Devnet) được xây dựng với Next.js, TypeScript, wagmi và ethers.js.

## ✨ Tính năng

- 🔗 **Kết nối ví**: Hỗ trợ MetaMask và các ví Web3 khác
- 📈 **Delegate**: Stake HII tokens để nhận rewards
- 📉 **Undelegate**: Unstake HII tokens
- 📊 **Thống kê**: Xem thông tin staking và pool statistics
- 📜 **Lịch sử**: Theo dõi các giao dịch delegate/undelegate
- ⏰ **Unbond Requests**: Quản lý các yêu cầu unstake đang chờ xử lý

## Công nghệ sử dụng

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Blockchain**: wagmi, viem, ethers.js
- **Wallet**: WalletConnect, MetaMask
- **Styling**: TailwindCSS với shadcn/ui components

## Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd delegate
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình environment variables

Tạo file `.env.local` trong thư mục gốc:

```env
# Hii Network Configuration
NEXT_PUBLIC_CHAIN_ID=15984
NEXT_PUBLIC_CHAIN_NAME="Hii Network devnet"
NEXT_PUBLIC_RPC_URL=http://103.161.174.29:8545
NEXT_PUBLIC_EXPLORER_URL=http://103.161.174.30:8067
NEXT_PUBLIC_NATIVE_CURRENCY_NAME=HII
NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL=HII
NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS=18
NEXT_PUBLIC_STAKEHUB_ADDRESS=0x0000000000000000000000000000000000001000
NEXT_PUBLIC_OPERATOR_ADDRESS=0x38D7c621FdB099A0c5b91adBd6B687e5DC6a2Fd5

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 4. Chạy ứng dụng

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## Cấu trúc dự án

```
delegate/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ConnectWalletButton.tsx
│   ├── DelegateForm.tsx
│   └── StakingInfo.tsx
├── config/                # Configuration files
│   ├── abi.ts            # Contract ABIs
│   ├── contracts.ts      # Contract addresses
│   └── env.ts            # Environment config
├── hooks/                 # Custom React hooks
│   ├── useDelegate.ts
│   ├── useUndelegate.ts
│   ├── useClaim.ts
│   ├── useStakingInfo.ts
│   └── index.ts
├── lib/                   # Utility libraries
│   └── wagmi.ts          # Wagmi configuration
└── BE/                   # Backend reference
    └── stake_delegate.js # Original reference script
```

## Sử dụng

### 1. Kết nối ví

- Nhấn nút "Connect Wallet" ở góc trên
- Chọn ví bạn muốn sử dụng (MetaMask, TrustWallet, etc.)
- Xác nhận kết nối trong ví

### 2. Delegate (Stake)

- Chọn tab "Delegate (Stake)"
- Nhập số lượng HII muốn stake
- Nhấn "Stake HII"
- Xác nhận giao dịch trong ví

### 3. Undelegate (Unstake)

- Chọn tab "Undelegate (Unstake)"
- Nhập số lượng HII muốn unstake
- Nhấn "Unstake HII"
- Xác nhận giao dịch trong ví

### 4. Claim Tokens

- Sau khi undelegate, chờ thời gian unlock
- Khi có tokens claimable, nhấn "Claim Tokens"
- Xác nhận giao dịch trong ví

### 5. Theo dõi thông tin

- Xem balance và shares hiện tại
- Kiểm tra pending unbond requests
- Xem chi tiết từng unbond request

## API Reference

### Hooks

#### `useDelegate()`
```typescript
const { delegate, isLoading, isSuccess, error, txHash } = useDelegate();
```

#### `useUndelegate()`
```typescript
const { undelegate, isLoading, isSuccess, error, txHash } = useUndelegate();
```

#### `useClaim()`
```typescript
const { claim, isLoading, isSuccess, error, txHash } = useClaim();
```

#### `useStakingInfo()`
```typescript
const { stakingInfo, isLoading, error, refetch } = useStakingInfo();
```

## Cấu hình mạng

Ứng dụng được cấu hình để hoạt động trên Hii Network Devnet:

- **Chain ID**: 15984
- **RPC URL**: http://103.161.174.29:8545
- **Explorer**: http://103.161.174.30:8067
- **Currency**: HII

## ⚠️ Lưu ý quan trọng

1. **Devnet**: Đây là ứng dụng devnet, sử dụng HII (test HII)
2. **Ví**: Đảm bảo ví của bạn được kết nối với Hii Network Devnet
3. **Gas**: Luôn có đủ HII để trả gas fee
4. **Giao dịch**: Luôn kiểm tra kỹ thông tin trước khi xác nhận giao dịch

## Troubleshooting

### Lỗi kết nối ví
- Đảm bảo ví đã được cài đặt và mở khóa
- Kiểm tra xem ví có hỗ trợ Hii Network không
- Thử refresh trang và kết nối lại

### Lỗi giao dịch
- Kiểm tra số dư HII trong ví
- Đảm bảo có đủ gas fee
- Kiểm tra kết nối mạng

### Lỗi load dữ liệu
- Kiểm tra kết nối internet
- Thử refresh trang
- Kiểm tra RPC URL trong file .env.local

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## License

MIT License

