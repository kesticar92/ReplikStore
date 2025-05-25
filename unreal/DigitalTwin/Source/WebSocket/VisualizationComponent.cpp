#include "VisualizationComponent.h"
#include "SensorManagerComponent.h"

UVisualizationComponent::UVisualizationComponent()
{
    PrimaryComponentTick.bCanEverTick = true;
}

void UVisualizationComponent::BeginPlay()
{
    Super::BeginPlay();

    // Obtener referencia al SensorManager
    SensorManager = GetOwner()->FindComponentByClass<USensorManagerComponent>();
    if (SensorManager)
    {
        SensorManager->OnSensorDataUpdated.AddDynamic(this, &UVisualizationComponent::OnSensorDataUpdated);
    }
}

void UVisualizationComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
}

void UVisualizationComponent::AddSensorVisualization(const FString& SensorId, UStaticMeshComponent* MeshComponent, UMaterialInstanceDynamic* Material, const FVector& Location, const FString& Type)
{
    if (!MeshComponent || !Material)
    {
        return;
    }

    FSensorVisualization NewVisualization;
    NewVisualization.SensorId = SensorId;
    NewVisualization.MeshComponent = MeshComponent;
    NewVisualization.MaterialInstance = Material;
    NewVisualization.Location = Location;
    NewVisualization.Type = Type;

    SensorVisualizations.Add(SensorId, NewVisualization);
}

void UVisualizationComponent::UpdateSensorVisualization(const FString& SensorId, float Value)
{
    if (FSensorVisualization* Visualization = SensorVisualizations.Find(SensorId))
    {
        UpdateMaterialParameters(*Visualization, Value);
    }
}

void UVisualizationComponent::RemoveSensorVisualization(const FString& SensorId)
{
    SensorVisualizations.Remove(SensorId);
}

void UVisualizationComponent::OnSensorDataUpdated(const FSensorData& SensorData)
{
    UpdateSensorVisualization(SensorData.SensorId, SensorData.Value);
}

void UVisualizationComponent::UpdateMaterialParameters(const FSensorVisualization& Visualization, float Value)
{
    if (!Visualization.MaterialInstance)
    {
        return;
    }

    // Actualizar parámetros del material según el tipo de sensor
    if (Visualization.Type.Equals(TEXT("temperatura")))
    {
        // Mapear temperatura a color (azul = frío, rojo = caliente)
        float NormalizedValue = FMath::GetMappedRangeValueClamped(
            FVector2D(0.0f, 50.0f),   // Rango de temperatura
            FVector2D(0.0f, 1.0f),    // Rango normalizado
            Value
        );
        
        Visualization.MaterialInstance->SetScalarParameterValue(TEXT("Temperature"), NormalizedValue);
    }
    else if (Visualization.Type.Equals(TEXT("humedad")))
    {
        // Mapear humedad (0-100%)
        float NormalizedValue = FMath::Clamp(Value / 100.0f, 0.0f, 1.0f);
        Visualization.MaterialInstance->SetScalarParameterValue(TEXT("Humidity"), NormalizedValue);
    }
    else if (Visualization.Type.Equals(TEXT("presion")))
    {
        // Mapear presión (800-1200 hPa)
        float NormalizedValue = FMath::GetMappedRangeValueClamped(
            FVector2D(800.0f, 1200.0f),
            FVector2D(0.0f, 1.0f),
            Value
        );
        Visualization.MaterialInstance->SetScalarParameterValue(TEXT("Pressure"), NormalizedValue);
    }
} 