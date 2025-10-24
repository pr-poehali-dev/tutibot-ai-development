import json
import os
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обработка сообщений для TuTiBot с ИИ-ответами (OpenAI, GigaChat, YandexGPT)
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
        gigachat_key = os.environ.get('GIGACHAT_API_KEY')
        yandex_key = os.environ.get('YANDEX_API_KEY')
        
        response_text = None
        
        if openai_key:
            response_text = try_openai(openai_key, user_message, has_image)
        
        if not response_text and gigachat_key:
            response_text = try_gigachat(gigachat_key, user_message)
        
        if not response_text and yandex_key:
            response_text = try_yandexgpt(yandex_key, user_message)
        
        if not response_text:
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


def try_openai(api_key: str, message: str, has_image: bool) -> str:
    try:
        import openai
        openai.api_key = api_key
        
        system_prompt = "Ты TuTiBot - дружелюбный ИИ-ассистент. Отвечай кратко и полезно на русском языке."
        
        if has_image:
            system_prompt += " Пользователь прикрепил изображение. Помоги проанализировать его."
        
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        return completion.choices[0].message.content
        
    except Exception:
        return None


def try_gigachat(api_key: str, message: str) -> str:
    try:
        import requests
        
        auth_response = requests.post(
            'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
            headers={'Authorization': f'Basic {api_key}', 'RqUID': 'tutibot-request'},
            verify=False
        )
        
        if auth_response.status_code != 200:
            return None
            
        access_token = auth_response.json().get('access_token')
        
        chat_response = requests.post(
            'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'GigaChat',
                'messages': [
                    {'role': 'system', 'content': 'Ты TuTiBot - дружелюбный ИИ-ассистент. Отвечай кратко и полезно.'},
                    {'role': 'user', 'content': message}
                ],
                'max_tokens': 500,
                'temperature': 0.7
            },
            verify=False
        )
        
        if chat_response.status_code == 200:
            return chat_response.json()['choices'][0]['message']['content']
        
        return None
        
    except Exception:
        return None


def try_yandexgpt(api_key: str, message: str) -> str:
    try:
        import requests
        
        folder_id = os.environ.get('YANDEX_FOLDER_ID', '')
        
        response = requests.post(
            'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            headers={
                'Authorization': f'Api-Key {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'modelUri': f'gpt://{folder_id}/yandexgpt-lite',
                'completionOptions': {
                    'stream': False,
                    'temperature': 0.7,
                    'maxTokens': 500
                },
                'messages': [
                    {'role': 'system', 'text': 'Ты TuTiBot - дружелюбный ИИ-ассистент. Отвечай кратко и полезно.'},
                    {'role': 'user', 'text': message}
                ]
            }
        )
        
        if response.status_code == 200:
            return response.json()['result']['alternatives'][0]['message']['text']
        
        return None
        
    except Exception:
        return None


def get_fallback_response(message: str, has_image: bool) -> str:
    if has_image:
        return '🖼️ Вижу изображение! Для анализа фото добавь API ключ:\n• OpenAI (доступен через VPN)\n• GigaChat от Сбера (работает в РФ)\n• YandexGPT (работает в РФ)'
    
    lower = message.lower()
    
    if any(word in lower for word in ['привет', 'здравствуй', 'hello', 'hi']):
        return 'Привет! Я TuTiBot, твой ИИ-ассистент. Чем могу помочь? 😊'
    
    if any(word in lower for word in ['как дела', 'как ты', 'как сам']):
        return 'Отлично работаю! Готов помочь тебе 24/7 🚀'
    
    if any(word in lower for word in ['помощь', 'команды', 'что умеешь', 'api']):
        return '''Я могу помочь с разными задачами! 🤖

Для умных ответов добавь один из API ключей:

🔹 GigaChat (Сбер) - работает в РФ
   Получить: https://developers.sber.ru/gigachat

🔹 YandexGPT - работает в РФ  
   Получить: https://cloud.yandex.ru/services/yandexgpt

🔹 OpenAI - нужен VPN
   Получить: https://platform.openai.com

Просто добавь любой ключ в настройках! 😊'''
    
    if any(word in lower for word in ['спасибо', 'благодарю', 'thanks']):
        return 'Всегда пожалуйста! Рад помочь! 😊'
    
    if '?' in message or any(word in lower for word in ['как', 'что', 'где', 'когда', 'почему', 'зачем']):
        return f'Интересный вопрос! 🤔\n\nДля умных ответов добавь API:\n• GigaChat (Сбер) - для РФ\n• YandexGPT - для РФ\n• OpenAI - через VPN'
    
    return 'Понял тебя! Для умных ответов добавь GigaChat, YandexGPT или OpenAI API! 🤖'
