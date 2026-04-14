import { NextResponse } from 'next/server';
import Vibrant from 'node-vibrant';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: 'Imagem ausente' }, { status: 400 });

    const base64Data = image.split(',')[1] || image;
    const buffer = Buffer.from(base64Data, 'base64');

    const palette = await Vibrant.from(buffer).getPalette();

    // LÓGICA DE SELEÇÃO DE DNA: Busca a cor mais viva para Primária e um tom suave para Secundária
    const primary = palette.Vibrant?.hex || palette.DarkVibrant?.hex || palette.Muted?.hex || '#4a322e';
    const secondary = palette.LightVibrant?.hex || palette.LightMuted?.hex || palette.Muted?.hex || '#c99090';
    const dark = palette.DarkMuted?.hex || '#2a1a18';

    return NextResponse.json({
      primary,
      secondary,
      dark,
      // Retorna também se a cor é escura ou clara para ajustes de contraste futuros
      isDark: palette.Vibrant?.titleTextColor === '#fff'
    });
  } catch (error) {
    console.error('Erro ao extrair cores:', error);
    return NextResponse.json({ error: 'Falha na extração de cores' }, { status: 500 });
  }
}
