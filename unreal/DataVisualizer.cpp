#include "DataVisualizer.h"
#include "Json.h"
#include "JsonUtilities.h"

ADataVisualizer::ADataVisualizer()
{
    PrimaryActorTick.bCanEverTick = true;

    // Crear componente de texto
    TextComponent = CreateDefaultSubobject<UTextRenderComponent>(TEXT("TextComponent"));
    RootComponent = TextComponent;
    TextComponent->SetTextRenderColor(FColor::White);
    TextComponent->SetWorldSize(50.0f);
    TextComponent->SetHorizontalAlignment(EHTA_Center);
    TextComponent->SetVerticalAlignment(EVRTA_TextCenter);

    // Crear componente de malla
    MeshComponent = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("MeshComponent"));
    MeshComponent->SetupAttachment(RootComponent);
}

void ADataVisualizer::BeginPlay()
{
    Super::BeginPlay();
    
    // Inicializar texto
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
    FString Type = Data->GetStringField(TEXT("type"));
    
    if (Type == TEXT("temperature"))
    {
        float Temperature = Data->GetNumberField(TEXT("temperature"));
        FString Unit = Data->GetStringField(TEXT("unit"));
        FString Status = Data->GetStringField(TEXT("status"));
        
        // Actualizar texto
        FString DisplayText = FString::Printf(TEXT("Sensor: %s\nTemperatura: %.1f %s\nEstado: %s"),
            *SensorId, Temperature, *Unit, *Status);
        UpdateText(DisplayText);
        
        // Actualizar color según el estado
        if (Status == TEXT("normal"))
        {
            UpdateColor(NormalColor);
        }
        else if (Status == TEXT("warning"))
        {
            UpdateColor(WarningColor);
        }
        else if (Status == TEXT("critical"))
        {
            UpdateColor(CriticalColor);
        }
    }
    else if (Type == TEXT("presence"))
    {
        bool Presence = Data->GetBoolField(TEXT("presence"));
        float Confidence = Data->GetNumberField(TEXT("confidence"));
        
        FString DisplayText = FString::Printf(TEXT("Sensor: %s\nPresencia: %s\nConfianza: %.1f%%"),
            *SensorId, Presence ? TEXT("Detectada") : TEXT("No detectada"), Confidence * 100.0f);
        UpdateText(DisplayText);
        
        UpdateColor(Presence ? WarningColor : NormalColor);
    }
    else if (Type == TEXT("movement"))
    {
        TSharedPtr<FJsonObject> Position = Data->GetObjectField(TEXT("position"));
        float X = Position->GetNumberField(TEXT("x"));
        float Y = Position->GetNumberField(TEXT("y"));
        float Z = Position->GetNumberField(TEXT("z"));
        
        FString DisplayText = FString::Printf(TEXT("Sensor: %s\nPosición: (%.1f, %.1f, %.1f)"),
            *SensorId, X, Y, Z);
        UpdateText(DisplayText);
        
        UpdateColor(NormalColor);
    }
    else if (Type == TEXT("humidity"))
    {
        float Humidity = Data->GetNumberField(TEXT("humidity"));
        FString Unit = Data->GetStringField(TEXT("unit"));
        FString Status = Data->GetStringField(TEXT("status"));
        
        FString DisplayText = FString::Printf(TEXT("Sensor: %s\nHumedad: %.1f %s\nEstado: %s"),
            *SensorId, Humidity, *Unit, *Status);
        UpdateText(DisplayText);
        
        if (Status == TEXT("normal"))
        {
            UpdateColor(NormalColor);
        }
        else if (Status == TEXT("warning"))
        {
            UpdateColor(WarningColor);
        }
        else if (Status == TEXT("critical"))
        {
            UpdateColor(CriticalColor);
        }
    }
    else if (Type == TEXT("stock"))
    {
        FString ProductId = Data->GetStringField(TEXT("product_id"));
        int32 CurrentStock = Data->GetIntegerField(TEXT("current_stock"));
        FString StockLevel = Data->GetStringField(TEXT("stock_level"));
        
        FString DisplayText = FString::Printf(TEXT("Sensor: %s\nProducto: %s\nStock: %d\nNivel: %s"),
            *SensorId, *ProductId, CurrentStock, *StockLevel);
        UpdateText(DisplayText);
        
        if (StockLevel == TEXT("normal"))
        {
            UpdateColor(NormalColor);
        }
        else if (StockLevel == TEXT("low"))
        {
            UpdateColor(WarningColor);
        }
        else if (StockLevel == TEXT("out"))
        {
            UpdateColor(CriticalColor);
        }
    }
} 