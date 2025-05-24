#include "WebSocketComponent.h"
#include "WebSocketsModule.h"
#include "Json.h"

UWebSocketComponent::UWebSocketComponent()
{
    PrimaryComponentTick.bCanEverTick = false;
}

void UWebSocketComponent::BeginPlay()
{
    Super::BeginPlay();
}

void UWebSocketComponent::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    Super::EndPlay(EndPlayReason);
    Disconnect();
}

void UWebSocketComponent::Connect(const FString& Url, const FString& Token)
{
    if (!FModuleManager::Get().IsModuleLoaded("WebSockets"))
    {
        FModuleManager::Get().LoadModule("WebSockets");
    }

    AuthToken = Token;
    WebSocket = FWebSocketsModule::Get().CreateWebSocket(Url);

    WebSocket->OnConnected().AddLambda([this]()
    {
        // Enviar autenticación al conectar
        TSharedPtr<FJsonObject> AuthObj = MakeShared<FJsonObject>();
        AuthObj->SetStringField(TEXT("type"), TEXT("auth"));
        AuthObj->SetStringField(TEXT("token"), AuthToken);

        FString AuthMessage;
        TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&AuthMessage);
        FJsonSerializer::Serialize(AuthObj.ToSharedRef(), Writer);

        WebSocket->Send(AuthMessage);
        
        AsyncTask(ENamedThreads::GameThread, [this]()
        {
            OnConnected.Broadcast();
        });
    });

    WebSocket->OnMessage().AddLambda([this](const FString& Message)
    {
        AsyncTask(ENamedThreads::GameThread, [this, Message]()
        {
            OnMessage.Broadcast(Message);
        });
    });

    WebSocket->OnConnectionError().AddLambda([this](const FString& Error)
    {
        AsyncTask(ENamedThreads::GameThread, [this, Error]()
        {
            OnError.Broadcast(Error);
        });
    });

    WebSocket->Connect();
}

void UWebSocketComponent::SendMessage(const FString& Message)
{
    if (WebSocket.IsValid() && WebSocket->IsConnected())
    {
        WebSocket->Send(Message);
    }
}

void UWebSocketComponent::Disconnect()
{
    if (WebSocket.IsValid())
    {
        WebSocket->Close();
        WebSocket = nullptr;
    }
} 