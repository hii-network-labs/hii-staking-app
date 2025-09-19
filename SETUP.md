# Hướng dẫn cài đặt và sử dụng HII Staking dApp

## Cài đặt

### 1. Cài đặt dependencies

```bash
yarn install
# hoặc
npm install
```

### 2. Cấu hình environment variables

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

### 3. Chạy ứng dụng

```bash
npm run dev
# hoặc
yarn dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## Cấu trúc dự án

```
delegate/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── unbond-request/
│   │       └── route.ts   # API để fetch unbond requests
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout với WagmiProvider
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ConnectWalletButton.tsx  # Nút kết nối ví
│   ├── DelegateForm.tsx         # Form delegate/undelegate
│   └── StakingInfo.tsx          # Hiển thị thông tin staking
├── config/                # Configuration files
│   ├── abi.ts            # Contract ABIs
│   ├── contracts.ts      # Contract addresses và chain config
│   └── env.ts            # Environment config
├── hooks/                 # Custom React hooks
│   ├── useDelegate.ts    # Hook cho delegate
│   ├── useUndelegate.ts  # Hook cho undelegate
│   ├── useClaim.ts       # Hook cho claim
│   ├── useStakingInfo.ts # Hook cho staking info
│   └── index.ts          # Export tất cả hooks
├── lib/                   # Utility libraries
│   └── wagmi.ts          # Wagmi configuration
├── types/                 # TypeScript types
│   └── index.ts          # Common types
└── BE/                   # Backend reference
    └── stake_delegate.js # Original reference script
```

## Tính năng chính

### 1. Kết nối ví
- Hỗ trợ MetaMask, TrustWallet và các ví khác
- Tự động phát hiện ví đã cài đặt
- Hiển thị địa chỉ ví đã kết nối

### 2. Delegate (Stake)
- Stake HII tokens để nhận rewards
- Hiển thị trạng thái giao dịch (loading, success, error)
- Liên kết đến BscScan để xem giao dịch

### 3. Undelegate (Unstake)
- Unstake HII tokens
- Hiển thị trạng thái giao dịch
- Liên kết đến BscScan

### 4. Claim
- Claim tokens đã unbond
- Hiển thị số lượng claimable
- Xác nhận giao dịch

### 5. Theo dõi thông tin
- Balance và shares hiện tại
- Pooled HNC amount
- Pending unbond requests
- Chi tiết từng unbond request
- Claimable unbond requests

## API Reference

### Hooks

#### `useDelegate()`
```typescript
const { delegate, isLoading, isSuccess, error, txHash } = useDelegate();

// Sử dụng
await delegate("1.0"); // Stake 1 HII
```

#### `useUndelegate()`
```typescript
const { undelegate, isLoading, isSuccess, error, txHash } = useUndelegate();

// Sử dụng
await undelegate("0.5"); // Unstake 0.5 HII
```

#### `useClaim()`
```typescript
const { claim, isLoading, isSuccess, error, txHash } = useClaim();

// Sử dụng
await claim(BigInt(0)); // Claim tất cả available requests
```

#### `useStakingInfo()`
```typescript
const { stakingInfo, isLoading, error, refetch } = useStakingInfo();

// stakingInfo chứa:
// - balance: string
// - pooledHNC: string
// - shares: string
// - pendingUnbondRequests: number
// - unbondRequests: UnbondRequest[]
// - claimableUnbondRequests: number
// - creditContractAddress: string
```

## Cấu hình mạng

Ứng dụng được cấu hình để hoạt động trên Hii Network Devnet:

- **Chain ID**: 15984
- **RPC URL**: http://103.161.174.29:8545
- **Explorer**: http://103.161.174.30:8067
- **Currency**: HII

1. **Devnet**: Đây là ứng dụng devnet, sử dụng HII
2. **Ví**: Đảm bảo ví của bạn được kết nối với Hii Network Devnet
3. **Gas**: Luôn có đủ HII để trả gas fee
4. **Kiểm tra**: Luôn kiểm tra kỹ thông tin trước khi xác nhận giao dịch

## Troubleshooting

### Lỗi kết nối ví
- Đảm bảo ví đã được cài đặt và mở khóa
- Kiểm tra xem ví có hỗ trợ BNB Smart Chain không
- Thử refresh trang và kết nối lại

### Lỗi giao dịch
- Kiểm tra số dư tBNB trong ví
- Đảm bảo có đủ gas fee
- Kiểm tra kết nối mạng

### Lỗi load dữ liệu
- Kiểm tra kết nối internet
- Thử refresh trang
- Kiểm tra RPC URL trong file .env.local

## Phát triển

### Thêm tính năng mới
1. Tạo hook mới trong thư mục `hooks/`
2. Tạo component mới trong thư mục `components/`
3. Cập nhật types trong `types/index.ts` nếu cần
4. Export hook mới trong `hooks/index.ts`

### Cấu hình contract mới
1. Thêm ABI vào `config/abi.ts`
2. Thêm địa chỉ vào `config/contracts.ts`
3. Cập nhật environment variables

### Styling
- Sử dụng TailwindCSS
- Các component sử dụng shadcn/ui patterns
- Responsive design cho mobile và desktop

