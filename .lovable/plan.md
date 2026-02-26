

# Widen the Search Input in the Pricing Comparison Widget

## Problem
The search bar in the Pricing Comparison Widget on product detail pages is too narrow (`w-48` = 12rem / 192px), making it difficult to type and read product names.

## Solution
Increase the width of the search input from `w-48` to `w-64` (16rem / 256px), and on smaller screens use `w-full` so it takes the available space.

## Changes

### File: `src/components/PricingComparisonWidget.tsx`
- **Line 161**: Change the Input className from `w-48` to `w-64` for a wider search field
- **Line 158**: Update the search container wrapper to allow more flexible sizing on mobile by adding `flex-1 min-w-[200px]`

This gives approximately 33% more typing space while keeping the layout clean.

