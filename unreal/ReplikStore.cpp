#include "ReplikStore.h"
#include "Modules/ModuleManager.h"

#define LOCTEXT_NAMESPACE "FReplikStoreModule"

void FReplikStoreModule::StartupModule()
{
    UE_LOG(LogTemp, Log, TEXT("Módulo ReplikStore iniciado"));
}

void FReplikStoreModule::ShutdownModule()
{
    UE_LOG(LogTemp, Log, TEXT("Módulo ReplikStore detenido"));
}

#undef LOCTEXT_NAMESPACE
    
IMPLEMENT_MODULE(FReplikStoreModule, ReplikStore) 