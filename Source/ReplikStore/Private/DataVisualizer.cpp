#include "DataVisualizer.h"
#include "Json.h"
#include "JsonUtilities.h"

ADataVisualizer::ADataVisualizer()
{
    PrimaryActorTick.bCanEverTick = true;

    TextComponent = CreateDefaultSubobject<UTextRenderComponent>(TEXT("TextComponent"));
    RootComponent = TextComponent;
    TextComponent->SetTextRenderColor(FColor::White);
    TextComponent->SetWorldSize(50.0f);
    TextComponent->SetHorizontalAlignment(EHTA_Center);
    TextComponent->SetVerticalAlignment(EVRTA_TextCenter);

    MeshComponent = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MeshComponent"));
    MeshComponent->SetupAttachment(RootComponent);
}

void ADataVisualizer::BeginPlay()
{
    Super::BeginPlay();
    UpdateText(FString::Printf(TEXT("Sensor: %s\nEsperando datos..."), *SensorId));
    UpdateColor(NormalColor);
}

void ADataVisualizer::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);
}

void ADataVisualizer::UpdateVisualization(const FString& Data)
{
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(Data);
    if (FJsonSerializer::Deserialize(Reader, JsonObject))
    {
        ProcessSensorData(JsonObject);
    }
}

void ADataVisualizer::UpdateText(const FString& Text)
{
    if (TextComponent)
    {
        TextComponent->SetText(FText::FromString(Text));
    }
}

void ADataVisualizer::UpdateColor(const FLinearColor& Color)
{
    if (MeshComponent)
    {
        UMaterialInstanceDynamic* DynamicMaterial = MeshComponent->CreateAndSetMaterialInstanceDynamic(0);
        if (DynamicMaterial)
        {
            DynamicMaterial->SetVectorParameterValue(TEXT("Color"), Color);
        }
    }
}

void ADataVisualizer::ProcessSensorData(const TSharedPtr<FJsonObject>& Data)
{
    // Implementa aquí el procesamiento de los datos del sensor según tu lógica
} 