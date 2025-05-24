#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "SensorManagerComponent.h"
#include "VisualizationComponent.generated.h"

USTRUCT(BlueprintType)
struct FSensorVisualization
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString SensorId;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    class UStaticMeshComponent* MeshComponent;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    UMaterialInstanceDynamic* MaterialInstance;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FVector Location;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    FString Type;
};

UCLASS(ClassGroup=(DigitalTwin), meta=(BlueprintSpawnableComponent))
class WEBSOCKET_API UVisualizationComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UVisualizationComponent();

    virtual void BeginPlay() override;
    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

    UFUNCTION(BlueprintCallable, Category = "DigitalTwin|Visualization")
    void AddSensorVisualization(const FString& SensorId, UStaticMeshComponent* MeshComponent, UMaterialInstanceDynamic* Material, const FVector& Location, const FString& Type);

    UFUNCTION(BlueprintCallable, Category = "DigitalTwin|Visualization")
    void UpdateSensorVisualization(const FString& SensorId, float Value);

    UFUNCTION(BlueprintCallable, Category = "DigitalTwin|Visualization")
    void RemoveSensorVisualization(const FString& SensorId);

protected:
    UPROPERTY()
    TMap<FString, FSensorVisualization> SensorVisualizations;

    UPROPERTY()
    class USensorManagerComponent* SensorManager;

    UFUNCTION()
    void OnSensorDataUpdated(const FSensorData& SensorData);

private:
    void UpdateMaterialParameters(const FSensorVisualization& Visualization, float Value);
}; 