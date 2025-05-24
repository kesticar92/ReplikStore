#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "WebSocketsModule.h"
#include "IWebSocket.h"
#include "WebSocketComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnWebSocketMessage, const FString&, Message);
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnWebSocketConnected);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnWebSocketError, const FString&, Error);

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class DIGITALTWIN_API UWebSocketComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UWebSocketComponent();

    UPROPERTY(BlueprintAssignable, Category = "WebSocket")
    FOnWebSocketMessage OnMessage;

    UPROPERTY(BlueprintAssignable, Category = "WebSocket")
    FOnWebSocketConnected OnConnected;

    UPROPERTY(BlueprintAssignable, Category = "WebSocket")
    FOnWebSocketError OnError;

    UFUNCTION(BlueprintCallable, Category = "WebSocket")
    void Connect(const FString& Url, const FString& Token);

    UFUNCTION(BlueprintCallable, Category = "WebSocket")
    void SendMessage(const FString& Message);

    UFUNCTION(BlueprintCallable, Category = "WebSocket")
    void Disconnect();

protected:
    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

private:
    TSharedPtr<IWebSocket> WebSocket;
    FString AuthToken;

    void OnConnectedCallback();
    void OnMessageCallback(const FString& Message);
    void OnErrorCallback(const FString& Error);
}; 