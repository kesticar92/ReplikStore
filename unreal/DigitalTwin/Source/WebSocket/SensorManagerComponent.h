#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "WebSocketComponent.h"
#include "SensorManagerComponent.generated.h"

USTRUCT(BlueprintType)
struct FSensorData
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, Category = "Sensor")
    FString SensorId;

    UPROPERTY(BlueprintReadWrite, Category = "Sensor")
    FString Type;

    UPROPERTY(BlueprintReadWrite, Category = "Sensor")
    float Value;

    UPROPERTY(BlueprintReadWrite, Category = "Sensor")
    FString Location;

    UPROPERTY(BlueprintReadWrite, Category = "Sensor")
    FDateTime Timestamp;
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSensorDataUpdated, const FSensorData&, SensorData);

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class DIGITALTWIN_API USensorManagerComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    USensorManagerComponent();

    UPROPERTY(BlueprintAssignable, Category = "Sensors")
    FOnSensorDataUpdated OnSensorDataUpdated;

    UFUNCTION(BlueprintCallable, Category = "Sensors")
    void Initialize(UWebSocketComponent* InWebSocket);

    UFUNCTION(BlueprintCallable, Category = "Sensors")
    void RequestSensorData(const FString& SensorId);

    UFUNCTION(BlueprintCallable, Category = "Sensors")
    TArray<FSensorData> GetAllSensorData() const;

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY()
    UWebSocketComponent* WebSocketComponent;

    TMap<FString, FSensorData> SensorDataMap;

    void HandleWebSocketMessage(const FString& Message);
    void ParseSensorData(const FString& JsonString);
}; 