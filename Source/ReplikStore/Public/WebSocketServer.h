#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "WebSocketsModule.h"
#include "WebSocketServer.generated.h"

UCLASS()
class REPLIKSTORE_API AWebSocketServer : public AActor
{
    GENERATED_BODY()
    
public:    
    AWebSocketServer();

protected:
    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

    UPROPERTY(EditAnywhere, Category = "WebSocket")
    int32 Port = 8080;

    UPROPERTY(EditAnywhere, Category = "WebSocket")
    FString ServerName = TEXT("ReplikStore WebSocket Server");

private:
    TSharedPtr<IWebSocketServer> WebSocketServer;
    
    void OnClientConnected(TSharedPtr<IWebSocket> Client);
    void OnClientDisconnected(TSharedPtr<IWebSocket> Client);
    void OnMessageReceived(TSharedPtr<IWebSocket> Client, const FString& Message);
    
    TMap<FString, TSharedPtr<IWebSocket>> ConnectedClients;
    
    UFUNCTION(BlueprintCallable, Category = "WebSocket")
    void BroadcastMessage(const FString& Message);
    
    UFUNCTION(BlueprintCallable, Category = "WebSocket")
    void SendMessageToClient(const FString& ClientId, const FString& Message);
}; 