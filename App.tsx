import React, { useState, useCallback } from 'react';
import { generateFacebookPost, generateImage, suggestImagePrompts } from './services/geminiService';
import { Tone, AspectRatio } from './types';
import { 
  SparklesIcon, ClipboardIcon, DownloadIcon, CheckIcon, LightbulbIcon, 
  SquareIcon, PortraitIcon, LandscapeIcon, PhotoIcon,
  ProductLaunchIcon, EventIcon, PromotionIcon, KnowledgeIcon,
  FriendlyIcon, ProfessionalIcon, HumorousIcon, InspirationalIcon, PersuasiveIcon
} from './components/Icons';

const templates: Record<string, { label: string; post: string; image: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; }> = {
  product_launch: {
    label: 'Ra mắt sản phẩm',
    icon: ProductLaunchIcon,
    post: `Chính thức ra mắt [Tên sản phẩm]! ✨\n\nSau bao ngày chờ đợi, chúng tôi tự hào giới thiệu sản phẩm mới nhất, được thiết kế để [Lợi ích chính cho khách hàng].\n\n🌟 Tính năng nổi bật:\n- [Tính năng 1]\n- [Tính năng 2]\n- [Tính năng 3]\n\n👉 Khám phá ngay tại [Link sản phẩm/website] và trở thành một trong những người đầu tiên sở hữu!\n\n#ra_mắt_sản_phẩm #[TênThươngHiệu] #[TênSảnPhẩm]`,
    image: `Hình ảnh sản phẩm [Tên sản phẩm] được trưng bày một cách chuyên nghiệp, trên nền sáng và tối giản, làm nổi bật các chi tiết thiết kế.`
  },
  event_announcement: {
    label: 'Thông báo sự kiện',
    icon: EventIcon,
    post: `📢 THÔNG BÁO SỰ KIỆN ĐẶC BIỆT!\n\nBạn đã sẵn sàng chưa? Hãy tham gia cùng chúng tôi tại sự kiện [Tên sự kiện]!\n\n🗓️ Thời gian: [Ngày], lúc [Giờ]\n📍 Địa điểm: [Địa điểm hoặc Link online]\n\nĐây là cơ hội tuyệt vời để [Mục đích sự kiện, ví dụ: gặp gỡ chuyên gia, học hỏi kiến thức mới, trải nghiệm sản phẩm].\n\nĐừng bỏ lỡ! Đăng ký tham gia ngay tại [Link đăng ký].\n\n#sự_kiện #[TênSựKiện] #[TênThươngHiệu]`,
    image: `Một banner sự kiện hấp dẫn với tên sự kiện "[Tên sự kiện]" được in đậm, cùng với các biểu tượng liên quan đến chủ đề sự kiện.`
  },
  special_promotion: {
    label: 'Khuyến mãi',
    icon: PromotionIcon,
    post: `🎉 KHUYẾN MÃI CỰC SỐC!\n\nƯu đãi đặc biệt chỉ trong [Số] ngày! Giảm giá [Phần trăm]% cho [Sản phẩm/Dịch vụ].\n\n🎁 Đừng bỏ lỡ cơ hội sở hữu [Sản phẩm/Dịch vụ] yêu thích với mức giá tốt nhất từ trước đến nay.\n\n⏰ Thời gian áp dụng: Từ [Ngày bắt đầu] đến [Ngày kết thúc].\n\n👉 Mua ngay tại [Link sản phẩm/website]!\n\n#khuyến_mãi #[TênThươngHiệu] #sale`,
    image: `Một hình ảnh quảng cáo rực rỡ với dòng chữ "GIẢM GIÁ [Phần trăm]%" nổi bật, xung quanh là hình ảnh của các sản phẩm đang được giảm giá.`
  },
  knowledge_sharing: {
    label: 'Chia sẻ kiến thức',
    icon: KnowledgeIcon,
    post: `💡 Mẹo hay bạn cần biết!\n\nHôm nay, chúng tôi muốn chia sẻ một mẹo hữu ích về [Chủ đề].\n\n[Nội dung mẹo/chia sẻ kiến thức ngắn gọn].\n\nHy vọng mẹo nhỏ này sẽ giúp bạn [Lợi ích mà mẹo mang lại].\n\nBạn có mẹo nào khác muốn chia sẻ không? Hãy bình luận bên dưới nhé!\n\n#mẹo_hay #chia_sẻ_kiến_thức #[TênThươngHiệu] #[ChủĐề]`,
    image: `Một hình ảnh đồ họa (infographic) đơn giản và sáng sủa, minh họa cho mẹo về [Chủ đề], với biểu tượng bóng đèn.`
  },
};


const App: React.FC = () => {
  const [postPrompt, setPostPrompt] = useState<string>('');
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [tone, setTone] = useState<Tone>(Tone.Friendly);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [numberOfImages, setNumberOfImages] = useState<number>(3);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPost, setGeneratedPost] = useState<string>('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const tones: { key: Tone; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; tooltip: string; }[] = [
    { key: Tone.Friendly, label: 'Thân thiện', icon: FriendlyIcon, tooltip: 'Tạo giọng văn ấm áp, gần gũi và dễ tiếp cận.' },
    { key: Tone.Professional, label: 'Chuyên nghiệp', icon: ProfessionalIcon, tooltip: 'Sử dụng ngôn ngữ trang trọng, lịch sự và có cấu trúc.' },
    { key: Tone.Humorous, label: 'Hài hước', icon: HumorousIcon, tooltip: 'Thêm yếu tố vui vẻ, dí dỏm để gây cười và giải trí.' },
    { key: Tone.Inspirational, label: 'Truyền cảm hứng', icon: InspirationalIcon, tooltip: 'Khơi dậy cảm xúc, động lực và sự tích cực.' },
    { key: Tone.Persuasive, label: 'Thuyết phục', icon: PersuasiveIcon, tooltip: 'Kêu gọi hành động mạnh mẽ và thuyết phục người đọc.' },
  ];
  
  const aspectRatios: { key: AspectRatio; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { key: '1:1', label: 'Vuông', icon: SquareIcon },
    { key: '9:16', label: 'Dọc', icon: PortraitIcon },
    { key: '16:9', label: 'Ngang', icon: LandscapeIcon },
  ];

  const handleSelectTemplate = (templateKey: string) => {
    const template = templates[templateKey];
    if (template) {
      setPostPrompt(template.post);
      setImagePrompt(template.image);
      setSelectedTemplate(templateKey);
      setSuggestedPrompts([]);
    }
  };

  const handleGenerateContent = useCallback(async () => {
    if (!postPrompt.trim() || !imagePrompt.trim()) {
      setError('Vui lòng nhập đầy đủ nội dung bài đăng và mô tả ảnh.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPost('');
    setGeneratedImages([]);

    try {
      const [postResponse, imagesResponse] = await Promise.all([
        generateFacebookPost(postPrompt, tone),
        generateImage(imagePrompt, aspectRatio, numberOfImages),
      ]);

      setGeneratedPost(postResponse);
      setGeneratedImages(imagesResponse);

    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi khi tạo nội dung. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [postPrompt, imagePrompt, tone, aspectRatio, numberOfImages]);
  
  const handleSuggestImagePrompts = useCallback(async () => {
    if (!postPrompt.trim()) {
      setSuggestionError('Vui lòng nhập nội dung bài đăng trước để nhận gợi ý.');
      return;
    }
    setIsSuggesting(true);
    setSuggestionError(null);
    setSuggestedPrompts([]);
    try {
      const suggestions = await suggestImagePrompts(postPrompt);
      setSuggestedPrompts(suggestions);
    } catch (err) {
      console.error(err);
      setSuggestionError('Không thể tạo gợi ý. Vui lòng thử lại.');
    } finally {
      setIsSuggesting(false);
    }
  }, [postPrompt]);

  const handleCopyText = useCallback(() => {
    if (generatedPost) {
      navigator.clipboard.writeText(generatedPost);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [generatedPost]);

  const handleDownloadImage = useCallback((imageUrl: string, index: number) => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `generated-image-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-600">
            TÌNH TẠO BÀI ĐĂNG FACEBOOK - MẠNH HỮU
          </h1>
          <p className="mt-2 text-slate-400">
            Tạo nội dung và hình ảnh hấp dẫn cho Facebook chỉ trong vài giây.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400 flex items-center">
              <SparklesIcon className="w-6 h-6 mr-2" />
              1. Nhập yêu cầu của bạn
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hoặc chọn một mẫu có sẵn
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(templates).map(([key, { label, icon: Icon }]) => (
                    <button
                      key={key}
                      onClick={() => handleSelectTemplate(key)}
                      title={label}
                      className={`px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 ${
                        selectedTemplate === key
                          ? 'bg-cyan-500 text-white shadow-md'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="postPrompt" className="block text-sm font-medium text-slate-300 mb-2">
                  Nội dung bài đăng
                </label>
                <textarea
                  id="postPrompt"
                  rows={5}
                  value={postPrompt}
                  onChange={(e) => {
                    setPostPrompt(e.target.value);
                    setSelectedTemplate(null);
                  }}
                  placeholder="Ví dụ: Quảng cáo về một loại cà phê hữu cơ mới, nhấn mạnh hương vị đậm đà và nguồn gốc bền vững..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                   <label htmlFor="imagePrompt" className="block text-sm font-medium text-slate-300">
                    Mô tả ảnh
                  </label>
                  <button 
                    onClick={handleSuggestImagePrompts} 
                    disabled={isSuggesting}
                    className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSuggesting ? (
                      <svg className="animate-spin h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <LightbulbIcon className="w-4 h-4" />
                    )}
                    Gợi ý
                  </button>
                </div>
                <textarea
                  id="imagePrompt"
                  rows={3}
                  value={imagePrompt}
                  onChange={(e) => {
                    setImagePrompt(e.target.value);
                    setSelectedTemplate(null);
                  }}
                  placeholder="Ví dụ: Một tách cà phê bốc khói trên bàn gỗ, xung quanh là những hạt cà phê rang..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
                 {suggestionError && <p className="text-red-400 text-xs mt-1">{suggestionError}</p>}
              </div>
              
              {suggestedPrompts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Gợi ý cho bạn:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setImagePrompt(prompt)}
                        className="px-3 py-1.5 text-xs text-left bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors border border-slate-600"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tỉ lệ khung hình
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {aspectRatios.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setAspectRatio(key)}
                        title={label}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 flex-1 justify-center ${
                          aspectRatio === key
                            ? 'bg-cyan-500 text-white shadow-md'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                    <PhotoIcon className="w-5 h-5 mr-2" />
                    Số lượng ảnh
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => setNumberOfImages(num)}
                        title={`Tạo ${num} ảnh`}
                        className={`w-14 h-10 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${
                          numberOfImages === num
                            ? 'bg-cyan-500 text-white shadow-md'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Chọn văn phong
                </label>
                <div className="flex flex-wrap gap-2">
                  {tones.map(({ key, label, icon: Icon, tooltip }) => (
                    <button
                      key={key}
                      onClick={() => setTone(key)}
                      title={tooltip}
                      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 flex items-center ${
                        tone === key
                          ? 'bg-cyan-500 text-white shadow-md'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateContent}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    Tạo Nội Dung
                  </>
                )}
              </button>
               {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">2. Kết quả</h2>
            
            {isLoading ? (
              <div className="space-y-6 animate-pulse">
                <div className="bg-slate-700 h-48 w-full rounded-lg"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-700 rounded"></div>
                  <div className="h-4 bg-slate-700 rounded w-5/6"></div>
                </div>
              </div>
            ) : generatedPost || generatedImages.length > 0 ? (
              <div className="space-y-6">
                {generatedImages.length > 0 && (
                  <div>
                    <div className="grid grid-cols-2 gap-4">
                      {generatedImages.map((imageSrc, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden">
                          <img src={imageSrc} alt={`Generated visual ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <button
                            onClick={() => handleDownloadImage(imageSrc, index)}
                            className="absolute bottom-2 right-2 p-2 bg-slate-900/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-slate-700"
                            title="Tải ảnh xuống"
                          >
                            <DownloadIcon className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {generatedPost && (
                  <div>
                    <div className="relative bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                      <button
                        onClick={handleCopyText}
                        className="absolute top-2 right-2 p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
                        title="Copy text"
                      >
                         {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5 text-slate-400" />}
                      </button>
                      <p className="text-slate-300 whitespace-pre-wrap">{generatedPost}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <p>Nội dung của bạn sẽ xuất hiện ở đây...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;