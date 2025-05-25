#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "IWebSocket.h"
#include "WebSocketManager.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnWebSocketEvent, const FString&, Message);

UCLASS()
class MYPROJECT2_API AWebSocketManager : public AActor
{
    GENERATED_BODY()

public:
    AWebSocketManager();

protected:
    virtual void BeginPlay() override;
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

private:
    TSharedPtr<IWebSocket> WebSocket;

    UFUNCTION()
    void OnWebSocketConnected();

    UFUNCTION()
    void OnWebSocketMessage(const FString& Message);

    UFUNCTION()
    void OnWebSocketClosed(int32 StatusCode, const FString& Reason, bool bWasClean);

public:
    // Delegados para Blueprints
    UPROPERTY(BlueprintAssignable, Category = "WebSocket")
    FOnWebSocketEvent OnSecurityEvent;

    UPROPERTY(BlueprintAssignable, Category = "WebSocket")
    FOnWebSocketEvent OnInventoryEvent;

    UPROPERTY(BlueprintAssignable, Category = "WebSocket")
    FOnWebSocketEvent OnCustomerEvent;

    UPROPERTY(BlueprintAssignable, Category = "WebSocket")
    FOnWebSocketEvent OnLayoutEvent;

    UPROPERTY(BlueprintAssignable, Category = "WebSocket")
    FOnWebSocketEvent OnLayoutWarning;

    UPROPERTY(BlueprintAssignable, Category = "WebSocket")
    FOnWebSocketEvent OnStatusUpdate;
};
