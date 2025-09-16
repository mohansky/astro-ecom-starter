
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



### Todo dicount coupons
#### APPLY
- A prefixed amount will be deducted on specified products
- A prefixed amount will be deducted from the order
- A percentage rebate on the total of the order
- A discount price provided by an alternate price list
- A discount on the shipping
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