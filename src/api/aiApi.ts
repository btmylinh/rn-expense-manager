import { apiClient } from './client';

export interface ParsedTransaction {
  content: string; // Nội dung giao dịch
  amount: number; // Số tiền
  transaction_date: string; // Ngày giao dịch (YYYY-MM-DD)
  category_name: string; // Tên danh mục
  type: 1 | 2; // 1 = thu nhập, 2 = chi tiêu
  user_category_id: number | null; // ID của user-category (null nếu không tìm thấy)
}

export interface ParseTransactionsResponse {
  code: string;
  message: string;
  data: {
    transactions: ParsedTransaction[];
  };
}

export interface SpeechToTextResponse {
  code: string;
  message: string;
  data: {
    text: string;
  };
}

export interface ImageToTextResponse {
  code: string;
  message: string;
  data: {
    text: string;
  };
}

export interface DetectCategoryResponse {
  code: string;
  message: string;
  data: {
    suggestion: {
      user_category_id: number | null;
      category_name: string | null;
      type: 1 | 2 | null;
      confidence?: string | null;
      reason?: string | null;
    };
  };
}

export const aiApi = {
  /**
   * Parse text thành danh sách transactions bằng AI
   * POST /ai/parse-transactions
   */
  parseTextToTransactions(text: string) {
    return apiClient.post<ParseTransactionsResponse>('/ai/parse-transactions', { text });
  },

  /**
   * Detect category based on transaction content
   * POST /ai/detect-category
   */
  detectCategory(content: string) {
    return apiClient.post<DetectCategoryResponse>('/ai/detect-category', { content });
  },

  /**
   * Convert audio file to text
   * POST /ai/speech-to-text
   * FormData: { audio: File, languageCode?: string }
   */
  speechToText(audioUri: string, languageCode: string = 'vi') {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/webm',
      name: 'recording.webm',
    } as any);
    formData.append('languageCode', languageCode);

    return apiClient.post<SpeechToTextResponse>('/ai/speech-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 0, // Chờ đến khi backend xử lý xong
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  },

  /**
   * Extract text from image
   * POST /ai/image-to-text
   * FormData: { image: File, languageHints?: string }
   */
  imageToText(imageUri: string, languageHints: string[] = ['vi', 'en']) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);
    formData.append('languageHints', languageHints.join(','));

    return apiClient.post<ImageToTextResponse>('/ai/image-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 0, // Chờ đến khi backend xử lý xong
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  },
};

