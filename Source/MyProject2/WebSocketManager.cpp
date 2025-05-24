#include "WebSocketManager.h"
#include "WebSocketsModule.h"
#include "IWebSocket.h"
#include "Json.h"
#include "JsonUtilities.h"

AWebSocketManager::AWebSocketManager()
{
    PrimaryActorTick.bCanEverTick = false;
}

void AWebSocketManager::BeginPlay()
{
    Super::BeginPlay();

    if (!FModuleManager::Get().IsModuleLoaded("WebSockets"))
    {
        FModuleManager::Get().LoadModule("WebSockets");
    }

    WebSocket = FWebSocketsModule::Get().CreateWebSocket(TEXT("ws://localhost:3000"));

    WebSocket->OnConnected().AddUObject(this, &AWebSocketManager::OnWebSocketConnected);
    WebSocket->OnMessage().AddUObject(this, &AWebSocketManager::OnWebSocketMessage);
    WebSocket->OnClosed().AddUObject(this, &AWebSocketManager::OnWebSocketClosed);

    WebSocket->Connect();
}

void AWebSocketManager::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    if (WebSocket.IsValid())
    {
        WebSocket->Close();
    }
    Super::EndPlay(EndPlayReason);
}

void AWebSocketManager::OnWebSocketConnected()
{
    UE_LOG(LogTemp, Log, TEXT("WebSocket conectado!"));
}

void AWebSocketManager::OnWebSocketMessage(const FString& Message)
{
    UE_LOG(LogTemp, Log, TEXT("Mensaje recibido: %s"), *Message);

    // Parsear el JSON y disparar el evento correspondiente
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Message);
    if (FJsonSerializer::Deserialize(Reader, JsonObject) && JsonObject.IsValid())
    {
        FString Type = JsonObject->GetStringField("type");
        if (Type == "security_event")
        {
            OnSecurityEvent.Broadcast(Message);
        }
        else if (Type == "inventory_event")
        {
            OnInventoryEvent.Broadcast(Message);
        }
        else if (Type == "customer_event")
        {
            OnCustomerEvent.Broadcast(Message);
        }
        else if (Type == "layout_event")
        {
            OnLayoutEvent.Broadcast(Message);
        }
        else if (Type == "layout_warning")
        {
            OnLayoutWarning.Broadcast(Message);
        }
        else if (Type == "status_update")
        {
            OnStatusUpdate.Broadcast(Message);
        }
    }
}

void AWebSocketManager::OnWebSocketClosed(int32 StatusCode, const FString& Reason, bool bWasClean)
{
    UE_LOG(LogTemp, Warning, TEXT("WebSocket cerrado: %s"), *Reason);
}
