import { NextRequest, NextResponse } from 'next/server';

interface NaverBookResult {
  title: string;
  author: string;
  publisher: string;
  pubdate: string;
  description: string;
  imageUrl: string;
}

interface NaverAPIItem {
  title: string;
  author: string;
  publisher: string;
  pubdate: string;
  description: string;
  image: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '검색어가 필요합니다' },
        { status: 400 }
      );
    }

    // 네이버 API 키 확인
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: '네이버 API 키가 설정되지 않았습니다. 환경변수 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET를 설정해주세요.' },
        { status: 500 }
      );
    }

    // 네이버 Book API 호출
    const searchUrl = `https://openapi.naver.com/v1/search/book.json?query=${encodeURIComponent(query)}&display=10`;

    const response = await fetch(searchUrl, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    if (!response.ok) {
      throw new Error('네이버 API 호출 실패');
    }

    const data = await response.json();

    // 결과 파싱
    const results: NaverBookResult[] = data.items.map((item: NaverAPIItem) => {
      // HTML 태그 제거
      const cleanTitle = item.title.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      let cleanDescription = item.description.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

      // 연속된 줄바꿈을 2개로 정규화 (문단 구분)
      cleanDescription = cleanDescription.replace(/\n{3,}/g, '\n\n');

      // 저자: ^ 구분자를 쉼표로 변환
      const cleanAuthor = item.author.replace(/\^/g, ', ');

      // 출판일 YYYYMMDD → YYYY 형식으로 변환
      const pubdate = item.pubdate ? item.pubdate.substring(0, 4) : '';

      return {
        title: cleanTitle,
        author: cleanAuthor,
        publisher: item.publisher,
        pubdate: pubdate,
        description: cleanDescription,
        imageUrl: item.image,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('네이버 API 오류:', error);
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
