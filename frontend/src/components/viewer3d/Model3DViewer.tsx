import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Warning, CenterFocusStrong, RotateRight, Fullscreen, FullscreenExit, Mouse, ZoomIn, PanTool } from '@mui/icons-material'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// ============================================
// TIPOS
// ============================================

interface Model3DViewerProps {
  modelUrl: string
  format?: 'glb' | 'gltf'
  backgroundColor?: string
  autoRotate?: boolean
  showControls?: boolean
  showStats?: boolean
  cameraPosition?: { x: number; y: number; z: number }
  lighting?: 'studio' | 'outdoor' | 'neutral'
  onLoad?: () => void
  onError?: (error: string) => void
  onProgress?: (progress: number) => void
  className?: string
  style?: React.CSSProperties
}

// ============================================
// COMPONENTE
// ============================================

const Model3DViewer: React.FC<Model3DViewerProps> = ({
  modelUrl,
  backgroundColor = '#1a1a2e',
  autoRotate = false,
  showControls = true,
  cameraPosition = { x: 5, y: 5, z: 5 },
  lighting = 'studio',
  onLoad,
  onError,
  onProgress,
  className = '',
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelRef = useRef<THREE.Group | null>(null)
  const animationFrameRef = useRef<number>(0)

  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Inicialização da cena
  const initScene = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Cena
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(backgroundColor)
    sceneRef.current = scene

    // Câmera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 1
    controls.minDistance = 1
    controls.maxDistance = 100
    controlsRef.current = controls

    // Iluminação baseada no tipo
    setupLighting(scene, lighting)

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222)
    scene.add(gridHelper)

    // Animação
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()
  }, [backgroundColor, cameraPosition, autoRotate, lighting])

  // Configurar iluminação
  const setupLighting = (scene: THREE.Scene, type: string) => {
    // Remover luzes existentes
    scene.children.filter(child => child instanceof THREE.Light).forEach(light => scene.remove(light))

    switch (type) {
      case 'studio':
        // Luz ambiente suave
        const ambientStudio = new THREE.AmbientLight(0xffffff, 0.4)
        scene.add(ambientStudio)
        
        // Luz principal
        const keyLight = new THREE.DirectionalLight(0xffffff, 1)
        keyLight.position.set(5, 10, 5)
        keyLight.castShadow = true
        scene.add(keyLight)
        
        // Luz de preenchimento
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.5)
        fillLight.position.set(-5, 5, -5)
        scene.add(fillLight)
        
        // Luz de contorno
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.3)
        rimLight.position.set(0, 5, -10)
        scene.add(rimLight)
        break

      case 'outdoor':
        // Luz do sol
        const sunLight = new THREE.DirectionalLight(0xffeedd, 1.2)
        sunLight.position.set(10, 20, 10)
        sunLight.castShadow = true
        scene.add(sunLight)
        
        // Luz ambiente do céu
        const skyLight = new THREE.HemisphereLight(0x87ceeb, 0x8b4513, 0.6)
        scene.add(skyLight)
        break

      case 'neutral':
      default:
        // Luz ambiente uniforme
        const ambientNeutral = new THREE.AmbientLight(0xffffff, 0.6)
        scene.add(ambientNeutral)
        
        // Luz direcional suave
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
        dirLight.position.set(5, 10, 5)
        scene.add(dirLight)
        break
    }
  }

  // Carregar modelo
  const loadModel = useCallback(() => {
    if (!sceneRef.current) return

    if (!modelUrl || modelUrl.trim() === '') {
      const errorMessage = 'URL do modelo não fornecida'
      setError(errorMessage)
      setIsLoading(false)
      onError?.(errorMessage)
      return
    }

    setIsLoading(true)
    setError(null)
    setLoadProgress(0)

    const loader = new GLTFLoader()

    loader.load(
      modelUrl,
      (gltf) => {
        try {
          // Remover modelo anterior
          if (modelRef.current) {
            sceneRef.current?.remove(modelRef.current)
          }

          const model = gltf.scene
          modelRef.current = model

          // Centralizar e escalar modelo
          const box = new THREE.Box3().setFromObject(model)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          
          if (maxDim > 0) {
            const scale = 3 / maxDim
            model.scale.setScalar(scale)
            model.position.sub(center.multiplyScalar(scale))
          } else {
            // Se não conseguir calcular dimensões, apenas centralizar
            model.position.set(0, 0, 0)
          }

          // Configurar sombras
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })

          sceneRef.current?.add(model)
          setLoadProgress(100)
          setIsLoading(false)
          onLoad?.()
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Erro ao processar modelo 3D'
          setError(errorMessage)
          setIsLoading(false)
          onError?.(errorMessage)
          console.error('Erro ao processar modelo:', err)
        }
      },
      (xhr) => {
        // Calcular progresso de forma segura
        let progress = 0
        if (xhr.total && xhr.total > 0) {
          progress = Math.round((xhr.loaded / xhr.total) * 100)
        } else if (xhr.loaded > 0) {
          // Se não temos total, mostrar progresso indeterminado mas não 0%
          progress = Math.min(95, 10 + Math.round(xhr.loaded / 100000)) // Estimativa baseada em KB
        } else {
          // Início do carregamento
          progress = 5
        }
        setLoadProgress(progress)
        onProgress?.(progress)
      },
      (err: unknown) => {
        let errorMessage = 'Erro ao carregar modelo 3D'
        
        // Mensagens de erro mais específicas
        const error = err instanceof Error ? err : { message: String(err) }
        if (error.message) {
          if (error.message.includes('404') || error.message.includes('Not Found')) {
            errorMessage = 'Modelo não encontrado. Verifique se a URL está correta.'
          } else if (error.message.includes('CORS') || error.message.includes('Network')) {
            errorMessage = 'Erro de conexão. Verifique se o servidor está acessível e permite CORS.'
          } else if (error.message.includes('Failed to load')) {
            errorMessage = 'Falha ao carregar o arquivo. Verifique se o formato é suportado (GLB/GLTF).'
          } else {
            errorMessage = `Erro: ${error.message}`
          }
        }
        
        setError(errorMessage)
        setIsLoading(false)
        setLoadProgress(0)
        onError?.(errorMessage)
        console.error('Erro ao carregar modelo:', err)
        console.error('URL tentada:', modelUrl)
      }
    )
  }, [modelUrl, onLoad, onError, onProgress])

  // Redimensionar
  const handleResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return

    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    cameraRef.current.aspect = width / height
    cameraRef.current.updateProjectionMatrix()
    rendererRef.current.setSize(width, height)
  }, [])

  // Reset camera
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return
    cameraRef.current.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
    controlsRef.current.reset()
  }, [cameraPosition])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Toggle auto-rotate
  const toggleAutoRotate = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = !controlsRef.current.autoRotate
    }
  }, [])

  // Inicialização
  useEffect(() => {
    initScene()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
    }
  }, [initScene, handleResize])

  // Carregar modelo quando URL mudar
  useEffect(() => {
    if (!modelUrl || modelUrl.trim() === '') {
      setError('URL do modelo não fornecida')
      setIsLoading(false)
      return
    }

    if (!sceneRef.current) {
      // Aguardar a cena ser inicializada
      const timer = setTimeout(() => {
        if (sceneRef.current) {
          loadModel()
        }
      }, 200)
      return () => clearTimeout(timer)
    }

    loadModel()
  }, [modelUrl, loadModel])

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[400px] ${className}`}
      style={style}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white text-sm">Carregando modelo... {loadProgress}%</p>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10">
          <Warning className="text-red-500 text-4xl mb-4" />
          <p className="text-white text-sm mb-4">{error}</p>
          <button
            onClick={loadModel}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Controls */}
      {showControls && !isLoading && !error && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 z-10">
          <button
            onClick={resetCamera}
            className="p-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition"
            title="Resetar câmera"
          >
            <CenterFocusStrong />
          </button>
          <button
            onClick={toggleAutoRotate}
            className="p-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition"
            title="Auto-rotação"
          >
            <RotateRight />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition"
            title="Tela cheia"
          >
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </button>
        </div>
      )}

      {/* Instructions */}
      {showControls && !isLoading && !error && (
        <div className="absolute top-4 left-4 text-white/60 text-xs z-10 space-y-1">
          <p className="flex items-center gap-1">
            <Mouse className="text-xs" />
            Arraste para rotacionar
          </p>
          <p className="flex items-center gap-1">
            <ZoomIn className="text-xs" />
            Scroll para zoom
          </p>
          <p className="flex items-center gap-1">
            <PanTool className="text-xs" />
            Shift+arraste para mover
          </p>
        </div>
      )}
    </div>
  )
}

export default Model3DViewer


