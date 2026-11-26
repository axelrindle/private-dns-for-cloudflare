package service

type BuildInfo struct {
	Version        string `json:"version"`
	CommitHash     string `json:"commitHash"`
	BuildTimestamp string `json:"buildTimestamp"`
}

// BuildInfoService exposes the version information linked into the binary.
type BuildInfoService struct {
	info BuildInfo
}

func NewBuildInfoService(info BuildInfo) *BuildInfoService {
	return &BuildInfoService{info: info}
}

func (b *BuildInfoService) Get() BuildInfo {
	return b.info
}
