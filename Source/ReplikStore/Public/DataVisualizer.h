#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Components/TextRenderComponent.h"
#include "Components/StaticMeshComponent.h"
#include "DataVisualizer.generated.h"

UCLASS()
class REPLIKSTORE_API ADataVisualizer : public AActor
{
    GENERATED_BODY()
    
public:    
    ADataVisualizer();

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

    UPROPERTY(EditAnywhere, Category = "Visualization")
    UTextRenderComponent* TextComponent;

    UPROPERTY(EditAnywhere, Category = "Visualization")
    UStaticMeshComponent* MeshComponent;

    UPROPERTY(EditAnywhere, Category = "Visualization")
    FString SensorId;

    UPROPERTY(EditAnywhere, Category = "Visualization")
    FLinearColor NormalColor = FLinearColor::Green;

    UPROPERTY(EditAnywhere, Category = "Visualization")
    FLinearColor WarningColor = FLinearColor::Yellow;

    UPROPERTY(EditAnywhere, Category = "Visualization")
    FLinearColor CriticalColor = FLinearColor::Red;

    UFUNCTION(BlueprintCallable, Category = "Visualization")
    void UpdateVisualization(const FString& Data);

private:
    void UpdateText(const FString& Text);
    void UpdateColor(const FLinearColor& Color);
    void ProcessSensorData(const TSharedPtr<FJsonObject>& Data);
}; 