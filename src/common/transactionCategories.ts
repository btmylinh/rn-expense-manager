export const TRANSFER_CATEGORY = {
  IN: { id: 1, type: 1 as 1 | 2 }, // Tiền chuyển đến
  OUT: { id: 2, type: 2 as 1 | 2 }, // Tiền chuyển đi
  SAVINGS: { id: 3, type: 2 as 1 | 2 }, // Góp tiết kiệm
};

export const getTodayDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

