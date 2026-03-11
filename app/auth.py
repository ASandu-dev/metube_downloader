import os
import json
import time
import bcrypt
import jwt
import logging
from aiohttp import web

log = logging.getLogger('auth')

SECRET_KEY = os.environ.get('SECRET_KEY', 'metube-secret-key-change-me-at-least-32-chars')
TOKEN_EXPIRATION = 24 * 60 * 60  # 24 hours
USERS_FILE = os.path.join(os.environ.get('STATE_DIR', '.'), 'users.json')

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        log.error(f"Error loading users: {e}")
        return {}

def save_users(users):
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f)
    except Exception as e:
        log.error(f"Error saving users: {e}")

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(username):
    payload = {
        'username': username,
        'exp': time.time() + TOKEN_EXPIRATION
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['username']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def register(request):
    try:
        data = await request.json()
    except:
        return web.json_response({'error': 'Invalid JSON'}, status=400)
        
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return web.json_response({'error': 'Username and password required'}, status=400)

    users = load_users()
    if username in users:
        return web.json_response({'error': 'User already exists'}, status=400)

    users[username] = hash_password(password)
    save_users(users)
    
    token = create_token(username)
    return web.json_response({'token': token, 'username': username})

async def login(request):
    try:
        data = await request.json()
    except:
        return web.json_response({'error': 'Invalid JSON'}, status=400)

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return web.json_response({'error': 'Username and password required'}, status=400)

    users = load_users()
    hashed = users.get(username)

    if not hashed or not check_password(password, hashed):
        return web.json_response({'error': 'Invalid username or password'}, status=401)

    token = create_token(username)
    return web.json_response({'token': token, 'username': username})

def get_auth_middleware(url_prefix):
    @web.middleware
    async def auth_middleware(request, handler):
        # Public routes (relative to URL_PREFIX)
        public_routes = [
            'login',
            'register',
            'version',
            'robots.txt',
            '', # root
        ]
        
        path = request.path
        
        # Normalize path if it starts with url_prefix
        rel_path = path
        if path.startswith(url_prefix):
            rel_path = path[len(url_prefix):]

        if rel_path in public_routes or rel_path.startswith('static/') or rel_path.startswith('socket.io'):
             return await handler(request)

        # Allow static assets
        if any(rel_path.endswith(ext) for ext in ['.js', '.css', '.png', '.ico', '.svg', '.webmanifest', '.woff', '.woff2', '.ttf']):
            return await handler(request)

        # Allow OPTIONS requests for CORS
        if request.method == 'OPTIONS':
            return await handler(request)

        # Check Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return web.json_response({'error': 'Unauthorized'}, status=401)

        token = auth_header.split(' ')[1]
        username = verify_token(token)
        if not username:
            return web.json_response({'error': 'Unauthorized'}, status=401)

        request['username'] = username
        return await handler(request)
    return auth_middleware
