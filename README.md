# Paper Roll Value Ranker

A static web application designed to help you compare the true cost of Bounty paper towels and Charmin toilet paper across different listings and retailers. It standardizes inconsistent sizing labels (like "double," "triple," and "mega") into a normalized metric to help you identify the most cost-effective options.

## Features

- **Automatic Parsing**: Paste in a product title, and the app automatically extracts the brand, pack size, and roll type.
- **True Cost Calculation**: 
  - **Bounty**: Calculates the cost per "Regular Roll".
  - **Charmin**: Calculates the cost per 100 sheets.
- **Ranked Results**: Keeps a running, sorted list of products so you can quickly see which listing offers the best value.
- **Customizable Roll Values**: Allows you to adjust the multipliers and sheet counts for different roll types as brands change their sizing (shrinkflation).

## How to Use

1. Visit the live tool at [https://jaminma.github.io/PaperRollValueRanker/](https://jaminma.github.io/PaperRollValueRanker/) (or open `index.html` locally).
2. Enter the **Product Title** (e.g., "Bounty Quick-Size Family Triple Rolls 8-Pk") and the **Price**.
3. (Optional) Provide a link to the product listing for easy reference.
4. Click **Calculate & Add**. The item will be added to the appropriate brand's ranking list.

## Modifying Roll Values

Due to "shrinkflation," brands occasionally adjust the number of sheets in a roll. You can easily update these values within the app:

1. Click the **Settings (gear)** icon in the top right corner of the app.
2. In the "Configure Roll Values" modal, you will see lists for Bounty, Charmin Ultra Soft, and Charmin Ultra Strong.
3. **Edit an existing value**: Change the number in the input box next to a roll type. The app will save your changes automatically.
4. **Add a new roll type**: Enter the new roll name and its value at the bottom of the corresponding brand section, then click the **+** button.
5. **Delete a roll type**: Click the trash can icon next to a roll type.
6. **Reset**: If you ever need to revert to the original settings, click **Reset to Defaults**.

*Note: Your custom roll values are saved locally in your browser's `localStorage`.*
