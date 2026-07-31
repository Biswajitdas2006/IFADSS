from pydantic_settings import BaseSettings
 
 
class Settings(BaseSettings):
    model_store_path: str = "./models_store"
    log_level: str = "INFO"
    ollama_enabled: bool = False
    cors_allowed_origins: str = "*"
    port: int = 7860
 
    class Config:
        env_file = ".env"
 
 
settings = Settings()