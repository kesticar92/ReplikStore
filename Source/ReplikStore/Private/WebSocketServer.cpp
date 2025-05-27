#include "WebSocketServer.h"
#include "WebSocketsModule.h"
#include "IWebSocketServer.h"
#include "Json.h"
#include "JsonUtilities.h"

AWebSocketServer::AWebSocketServer()
{
    PrimaryActorTick.bCanEverTick = true;
}

void AWebSocketServer::BeginPlay()
{
    Super::BeginPlay();
    
    // Inicializar el módulo WebSocket
    FWebSocketsModule& WebSocketsModule = FModuleManager::LoadModuleChecked<FWebSocketsModule>(TEXT("WebSockets"));
    
    // Crear el servidor WebSocket
    WebSocketServer = WebSocketsModule.CreateServer(
        FString::Printf(TEXT("ws://0.0.0.0:%d"), Port),
        ServerName
    );
    
    if (WebSocketServer.IsValid())
    {
        // Configurar callbacks
        WebSocketServer->OnClientConnected().AddUObject(this, &AWebSocketServer::OnClientConnected);
        WebSocketServer->OnClientDisconnected().AddUObject(this, &AWebSocketServer::OnClientDisconnected);
        WebSocketServer->OnMessageReceived().AddUObject(this, &AWebSocketServer::OnMessageReceived);
        
        UE_LOG(LogTemp, Log, TEXT("Servidor WebSocket iniciado en el puerto %d"), Port);
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("Error al iniciar el servidor WebSocket"));
    }
}

void AWebSocketServer::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    if (WebSocketServer.IsValid())
    {
        WebSocketServer->Shutdown();
    }
    
    Super::EndPlay(EndPlayReason);
}

void AWebSocketServer::OnClientConnected(TSharedPtr<IWebSocket> Client)
{
    FString ClientId = FGuid::NewGuid().ToString();
    ConnectedClients.Add(ClientId, Client);
    
    UE_LOG(LogTemp, Log, TEXT("Cliente conectado: %s"), *ClientId);
    
    // Enviar mensaje de bienvenida
    TSharedPtr<FJsonObject> WelcomeMessage = MakeShared<FJsonObject>();
    WelcomeMessage->SetStringField(TEXT("type"), TEXT("welcome"));
    WelcomeMessage->SetStringField(TEXT("client_id"), ClientId);
    
    FString WelcomeJson;
    TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&WelcomeJson);
    FJsonSerializer::Serialize(WelcomeMessage.ToSharedRef(), Writer);
    
    Client->Send(WelcomeJson);
}

void AWebSocketServer::OnClientDisconnected(TSharedPtr<IWebSocket> Client)
{
    FString ClientId;
    for (const auto& Pair : ConnectedClients)
    {
        if (Pair.Value == Client)
        {
            ClientId = Pair.Key;
            break;
        }
    }
    
    if (!ClientId.IsEmpty())
    {
        ConnectedClients.Remove(ClientId);
        UE_LOG(LogTemp, Log, TEXT("Cliente desconectado: %s"), *ClientId);
    }
}

void AWebSocketServer::OnMessageReceived(TSharedPtr<IWebSocket> Client, const FString& Message)
{
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Message);
    
    if (FJsonSerializer::Deserialize(Reader, JsonObject))
    {
        // Procesar el mensaje según su tipo
        FString MessageType = JsonObject->GetStringField(TEXT("type"));
        
        if (MessageType == TEXT("sensor_data"))
        {
            // Procesar datos del sensor
            TSharedPtr<FJsonObject> Data = JsonObject->GetObjectField(TEXT("data"));
            FString SensorId = Data->GetStringField(TEXT("sensor_id"));
            
            // Aquí puedes implementar la lógica para procesar los datos del sensor
            UE_LOG(LogTemp, Log, TEXT("Datos recibidos del sensor %s"), *SensorId);
            
            // Broadcast a todos los clientes
            BroadcastMessage(Message);
        }
    }
}

void AWebSocketServer::BroadcastMessage(const FString& Message)
{
    for (const auto& Pair : ConnectedClients)
    {
        Pair.Value->Send(Message);
    }
}

void AWebSocketServer::SendMessageToClient(const FString& ClientId, const FString& Message)
{
    if (TSharedPtr<IWebSocket>* Client = ConnectedClients.Find(ClientId))
    {
        (*Client)->Send(Message);
    }
} 