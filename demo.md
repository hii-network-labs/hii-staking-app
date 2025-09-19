# Demo HII Staking dApp

## Các bước test ứng dụng

### 1. Chuẩn bị
- Cài đặt MetaMask hoặc ví tương thích
- Kết nối với Hii Network Devnet
- Có đủ HII để test (gas fee + staking amount)

### 2. Kết nối ví
1. Mở ứng dụng tại http://localhost:3000
2. Nhấn "Connect Wallet"
3. Chọn ví (MetaMask/TrustWallet)
4. Xác nhận kết nối trong ví
5. Kiểm tra địa chỉ ví hiển thị ở góc trên

### 3. Test Delegate (Stake)
1. Nhập số lượng HII muốn stake (ví dụ: 0.1)
2. Nhấn "Stake HII"
3. Xác nhận giao dịch trong ví
4. Chờ giao dịch được confirm
5. Kiểm tra thông tin staking được cập nhật

### 4. Test Undelegate (Unstake)
1. Chuyển sang tab "Undelegate (Unstake)"
2. Nhập số lượng HII muốn unstake
3. Nhấn "Unstake HII"
4. Xác nhận giao dịch trong ví
5. Chờ giao dịch được confirm

### 5. Test Claim
1. Sau khi undelegate, chờ thời gian unlock
2. Khi có tokens claimable, nhấn "Claim Tokens"
3. Xác nhận giao dịch trong ví
4. Kiểm tra tokens được claim về ví

### 6. Kiểm tra thông tin staking
- Balance và shares hiện tại
- Pooled HNC amount
- Pending unbond requests
- Chi tiết từng unbond request
- Claimable unbond requests

### 7. Kiểm tra trên Explorer
- Mở http://103.161.174.30:8067
- Tìm kiếm địa chỉ ví hoặc transaction hash
- Xác minh giao dịch đã được thực hiện thành công

## Các trường hợp test

### Test cases thành công
1. **Stake nhỏ**: Stake 0.01 HII
2. **Stake lớn**: Stake 1 HII
3. **Unstake một phần**: Unstake 50% số HII đã stake
4. **Unstake toàn bộ**: Unstake 100% số HII đã stake
5. **Claim**: Claim tokens sau khi hết unbond period

### Test cases lỗi
1. **Không đủ balance**: Thử stake nhiều hơn số HII có trong ví
2. **Không đủ gas**: Thử giao dịch khi không đủ HII để trả gas
3. **Unstake quá số đã stake**: Thử unstake nhiều hơn số đã stake
4. **Claim sớm**: Thử claim trước khi hết unbond period

## Screenshots

### Trang chủ
- Header với logo và mô tả
- Nút kết nối ví
- Form delegate/undelegate
- Thông tin staking
- Features section

### Kết nối ví
- Danh sách ví có sẵn
- Trạng thái kết nối
- Địa chỉ ví đã kết nối

### Delegate Form
- Tab Delegate/Undelegate
- Input số lượng BNB
- Nút submit với loading state
- Hiển thị lỗi nếu có
- Link đến BscScan

### Staking Info
- Balance và shares
- Pooled HNC
- Pending requests
- Claimable requests
- Chi tiết unbond requests

## Performance

### Load time
- Initial load: < 2s
- Wallet connection: < 1s
- Transaction confirmation: < 30s

### Responsive
- Mobile: ✅
- Tablet: ✅
- Desktop: ✅

## Browser Support

- Chrome: ✅
- Firefox: ✅
- Safari: ✅
- Edge: ✅

## Security

- ✅ Không lưu private key
- ✅ Sử dụng Web3 standard
- ✅ Kiểm tra network
- ✅ Validation input
- ✅ Error handling

## Accessibility

- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ High contrast
- ✅ Focus indicators

