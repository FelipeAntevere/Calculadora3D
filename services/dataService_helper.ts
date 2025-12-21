
// ... previous code ...
const tDep = (order.time || 0) * config.depreciationPricePerHour;
const tTotal = tMat + tEne + tLab + tDep;

if (order.materialCost !== undefined && order.materialCost >= 0) {
    // Use the exact stored material cost
    estMaterial += order.materialCost * qty;

    // Distribute the remaining cost among other components
    const remainingCost = Math.max(0, orderProductCost - (order.materialCost * qty));
    const tRest = tEne + tLab + tDep;

    if (tRest > 0) {
        estEnergy += (tEne / tRest) * remainingCost;
        estLabor += (tLab / tRest) * remainingCost;
        estDepreciation += (tDep / tRest) * remainingCost;
    }
} else if (tTotal > 0 && orderProductCost > 0) {
    estMaterial += (tMat / tTotal) * orderProductCost;
    estEnergy += (tEne / tTotal) * orderProductCost;
    estLabor += (tLab / tTotal) * orderProductCost;
    estDepreciation += (tDep / tTotal) * orderProductCost;
}
// ... rest of the file ...
