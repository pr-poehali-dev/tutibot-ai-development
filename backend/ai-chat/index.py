import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обработка сообщений для TuTiBot с ИИ-ответами через OpenAI
    Args: event - dict с httpMethod, body (message, hasImage)
          context - объект с request_id
    Returns: HTTP response с ответом ИИ
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        user_message: str = body_data.get('message', '')
        has_image: bool = body_data.get('hasImage', False)
        
        openai_key = os.environ.get('OPENAI_API_KEY')
        
        if not openai_key:
            response_text = get_fallback_response(user_message, has_image)
        else:
            try:
                import openai
                openai.api_key = openai_key
                
                system_prompt = "Ты TuTiBot - дружелюбный ИИ-ассистент. Отвечай кратко и полезно на русском языке."
                
                if has_image:
                    system_prompt += " Пользователь прикрепил изображение. Помоги проанализировать его."
                
                completion = openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    max_tokens=500,
                    temperature=0.7
                )
                
                response_text = completion.choices[0].message.content
                
            except Exception:
                response_text = get_fallback_response(user_message, has_image)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'response': response_text,
                'timestamp': context.request_id
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }


def get_fallback_response(message: str, has_image: bool) -> str:
    if has_image:
        return '🖼️ Вижу изображение! К сожалению, для полного анализа изображений нужно добавить OpenAI API ключ в настройках проекта.'
    
    lower = message.lower()
    
    if any(word in lower for word in ['привет', 'здравствуй', 'hello', 'hi']):
        return 'Привет! Я TuTiBot, твой ИИ-ассистент. Чем могу помочь? 😊'
    
    if any(word in lower for word in ['как дела', 'как ты', 'как сам']):
        return 'Отлично работаю! Готов помочь тебе 24/7 🚀'
    
    if any(word in lower for word in ['помощь', 'команды', 'что умеешь']):
        return '''Я могу помочь тебе с разными задачами:
• Отвечать на вопросы
• Анализировать текст
• Помогать с решением проблем
• Объяснять сложные темы
• И многое другое!

Просто напиши мне что нужно 😊'''
    
    if any(word in lower for word in ['спасибо', 'благодарю', 'thanks']):
        return 'Всегда пожалуйста! Рад помочь! 😊'
    
    if '?' in message or any(word in lower for word in ['как', 'что', 'где', 'когда', 'почему', 'зачем']):
        return f'Интересный вопрос! Давай подумаем... {message[:50]}{"..." if len(message) > 50 else ""}\n\nДля более умных ответов добавь OpenAI API ключ в настройки! 🤖'
    
    return 'Понял тебя! Обрабатываю... Для умных ответов добавь OpenAI API ключ! 🤔'
