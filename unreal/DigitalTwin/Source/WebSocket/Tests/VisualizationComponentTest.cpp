#include "Misc/AutomationTest.h"
#include "VisualizationComponent.h"
#include "SensorManagerComponent.h"
#include "Components/StaticMeshComponent.h"
#include "Materials/MaterialInstanceDynamic.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FVisualizationComponentTest, "DigitalTwin.Visualization.ComponentTests",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FVisualizationComponentTest::RunTest(const FString& Parameters)
{
    // Crear componentes
    UVisualizationComponent* VisualizationComp = NewObject<UVisualizationComponent>();
    UStaticMeshComponent* MeshComp = NewObject<UStaticMeshComponent>();
    UMaterialInstanceDynamic* Material = NewObject<UMaterialInstanceDynamic>();
    
    TestNotNull("Visualization Component should be created", VisualizationComp);
    TestNotNull("Mesh Component should be created", MeshComp);
    TestNotNull("Material Instance should be created", Material);

    // Probar añadir visualización
    const FString TestSensorId = "test_sensor";
    const FVector TestLocation(100.0f, 100.0f, 100.0f);
    const FString TestType = "temperatura";

    VisualizationComp->AddSensorVisualization(TestSensorId, MeshComp, Material, TestLocation, TestType);

    // Probar actualización de visualización
    const float TestValue = 25.5f;
    VisualizationComp->UpdateSensorVisualization(TestSensorId, TestValue);

    // Probar eliminación de visualización
    VisualizationComp->RemoveSensorVisualization(TestSensorId);

    // Probar integración con SensorManager
    USensorManagerComponent* SensorManager = NewObject<USensorManagerComponent>();
    TestNotNull("SensorManager Component should be created", SensorManager);

    FSensorData TestData;
    TestData.SensorId = TestSensorId;
    TestData.Type = TestType;
    TestData.Value = TestValue;

    // Simular actualización de datos del sensor
    SensorManager->OnSensorDataUpdated.Broadcast(TestData);

    return true;
} 