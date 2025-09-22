
## 💳 Razorpay Test Cards

Use these test card details in development mode:

| Card Network | Card Number | CVV | Expiry Date |
|-------------|-------------|-----|-------------|
| Mastercard | `5267 3181 8797 5449` | Any 3 digits | Any future date |
| Visa | `4386 2894 0766 0153` | Any 3 digits | Any future date |

**Test Scenarios:**
- **Successful Payment**: Use above cards
- **Failed Payment**: Use card number `4000000000000002`
- **Insufficient Funds**: Use card number `4000000000000341`



### Discount Coupons Features
#### IMPLEMENTED FEATURES
- Percentage-based discounts on order total
- Fixed amount discounts on order total
- Minimum order value requirements
- Coupon usage limits and tracking
- Active/inactive coupon status
- Admin coupon management interface
- A prefixed amount will be deducted on specified products
- A rate will be deducted on specified products
- A prefixed amount will be deducted on items of specified categories
- A rate will be deducted on products of specified categories
- Offer free products when a customer buys a specified quantity of a product
- Fixed amount on a subscription
- Rate on a subscription

### CHOOSE WHEN THE DISCOUNT SHOULD BE APPLIED
#### CONDITION
- Manually enter a discount code
- When an order reaches a specific amount
- When a product is added a number of times
- When cart only contains specified products
- When cart contains some of the specified products
- When cart contains at least all specified products
- When cart only contains products from the specified categories
- When cart contains some products from the specified categories



// [[kv_namespaces]]
// binding = "SESSION"
// id = "your_kv_namespace_id"
// preview_id = "your_preview_kv_namespace_id"