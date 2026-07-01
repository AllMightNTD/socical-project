export const getSeatPositions = (maxPlayers: number) => {
  const positions = [];
  for (let i = 0; i < maxPlayers; i++) {
    // Start from top-middle (-90 degrees) and go clockwise
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / maxPlayers;
    
    // Push seats outside the table: X radius ~55%, Y radius ~62%
    let left = 50 + 56 * Math.cos(angle);
    let top = 50 + 64 * Math.sin(angle);
    
    positions.push({ top, left });
  }
  return positions;
};
