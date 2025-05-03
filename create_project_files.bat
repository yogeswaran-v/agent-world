REM Create backend structure
mkdir backend
mkdir backend\app
mkdir backend\app\models
mkdir backend\app\routers
mkdir backend\app\services
mkdir backend\app\core

REM Create backend main files
type nul > backend\Dockerfile
type nul > backend\requirements.txt
type nul > backend\app\__init__.py
type nul > backend\app\main.py

REM Create backend models
type nul > backend\app\models\__init__.py
type nul > backend\app\models\agent.py
type nul > backend\app\models\pydantic_models.py

REM Create backend routers
type nul > backend\app\routers\__init__.py
type nul > backend\app\routers\agents.py
type nul > backend\app\routers\websockets.py

REM Create backend services
type nul > backend\app\services\__init__.py
type nul > backend\app\services\agent_service.py
type nul > backend\app\services\conversation_service.py
type nul > backend\app\services\thinking_service.py

REM Create backend core
type nul > backend\app\core\__init__.py
type nul > backend\app\core\config.py
type nul > backend\app\core\logger.py

REM Create frontend structure
mkdir frontend
mkdir frontend\components
mkdir frontend\components\layout
mkdir frontend\components\world
mkdir frontend\components\controls
mkdir frontend\components\info
mkdir frontend\pages
mkdir frontend\hooks
mkdir frontend\lib
mkdir frontend\styles
mkdir frontend\public

REM Create frontend main files
type nul > frontend\Dockerfile
type nul > frontend\package.json
type nul > frontend\next.config.js

REM Create frontend components
type nul > frontend\components\layout\Layout.js
type nul > frontend\components\layout\Navbar.js
type nul > frontend\components\world\WorldCanvas.js
type nul > frontend\components\world\Agent.js
type nul > frontend\components\world\Terrain.js
type nul > frontend\components\controls\ControlPanel.js
type nul > frontend\components\controls\AgentSelector.js
type nul > frontend\components\controls\SpeedControl.js
type nul > frontend\components\info\AgentMemory.js
type nul > frontend\components\info\AgentThought.js
type nul > frontend\components\info\Conversations.js

REM Create frontend pages
type nul > frontend\pages\_app.js
type nul > frontend\pages\index.js

REM Create frontend hooks
type nul > frontend\hooks\useAgentData.js
type nul > frontend\hooks\useSimulation.js
type nul > frontend\hooks\useWebSocket.js

REM Create frontend lib files
type nul > frontend\lib\api.js
type nul > frontend\lib\constants.js

REM Create other files
type nul > docker-compose.yml
type nul > README.md